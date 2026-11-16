// Админка Concha: товары, заказы, подписчики и тексты сайта.
// Работает напрямую с Supabase (см. supabase/admin.sql). Пускает только администратора:
// права проверяет сама база (Row Level Security), а не эта страница.

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = v => "$" + Number(v).toFixed(2);
const fmtDate = d => new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const imgUrl = src => (!src ? "" : /^(https?:|data:|blob:)/.test(src) ? src : "../" + src);

const CATS = { rings: "Кольца", earrings: "Серьги", necklaces: "Колье", bracelets: "Браслеты", chains: "Цепочки" };
const STATUSES = { new: "Новый", confirmed: "Подтверждён", shipped: "Отправлен", done: "Выполнен", cancelled: "Отменён" };
const BUCKET = "product-images";

const cfg = window.CONCHA_BACKEND || {};
let db = null;

function toast(text, bad = false) {
  const el = $("toast");
  el.textContent = text;
  el.className = "toast" + (bad ? " bad" : "");
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 3500);
}
const errText = e => {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return "Неверный email или пароль.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Нет связи с базой. Проверьте интернет.";
  if (/row-level security|permission denied/i.test(m)) return "Нет прав. Войдите заново.";
  if (/duplicate key/i.test(m)) return "Товар с таким английским названием уже есть.";
  return m;
};

function show(view) {
  ["loginView", "setupView", "appView"].forEach(v => { $(v).hidden = v !== view; });
}

// ---------- вход ----------
async function start() {
  if (!cfg.url || !cfg.anonKey || !window.supabase) return show("setupView");
  db = window.supabase.createClient(cfg.url, cfg.anonKey);
  db.auth.onAuthStateChange(event => {
    if (event === "PASSWORD_RECOVERY") {
      show("loginView");
      $("loginFields").hidden = true;
      $("newPassFields").hidden = false;
    }
  });
  const { data } = await db.auth.getSession();
  if (data.session && !location.hash.includes("type=recovery")) await enter(data.session);
  else if (!location.hash.includes("type=recovery")) show("loginView");
}

async function enter(session) {
  const { data: ok, error } = await db.rpc("is_admin");
  if (error || !ok) {
    await db.auth.signOut();
    show("loginView");
    setLoginMsg(error ? errText(error) : "У этого аккаунта нет доступа к админке. Как его дать — в supabase/README.md.", true);
    return;
  }
  $("whoami").textContent = session.user.email;
  show("appView");
  openTab(location.hash.slice(1) || "products");
  loadOrders(); // для счётчика новых заказов
}

function setLoginMsg(text, bad) {
  $("loginMsg").textContent = text || "";
  $("loginMsg").className = "msg" + (bad ? " bad" : "");
}

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!$("newPassFields").hidden) return;
  $("loginBtn").disabled = true;
  setLoginMsg("Входим…");
  const { data, error } = await db.auth.signInWithPassword({ email: $("lEmail").value.trim(), password: $("lPass").value });
  $("loginBtn").disabled = false;
  if (error) return setLoginMsg(errText(error), true);
  setLoginMsg("");
  $("lPass").value = "";
  enter(data.session);
});

$("forgotBtn").addEventListener("click", async () => {
  const email = $("lEmail").value.trim();
  if (!email) return setLoginMsg("Впишите email, и мы пришлём ссылку для нового пароля.", true);
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.href.split("#")[0] });
  setLoginMsg(error ? errText(error) : "Письмо отправлено. Откройте ссылку из письма.", !!error);
});

$("newPassBtn").addEventListener("click", async () => {
  const pw = $("lNewPass").value;
  if (pw.length < 8) return setLoginMsg("Пароль должен быть не короче 8 символов.", true);
  const { error } = await db.auth.updateUser({ password: pw });
  if (error) return setLoginMsg(errText(error), true);
  history.replaceState(null, "", location.pathname);
  $("loginFields").hidden = false;
  $("newPassFields").hidden = true;
  setLoginMsg("");
  const { data } = await db.auth.getSession();
  enter(data.session);
});

$("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  location.hash = "";
  show("loginView");
});

// ---------- вкладки ----------
const loaded = {};
function openTab(name) {
  if (!$("tab-" + name)) name = "products";
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".main > section").forEach(s => { s.hidden = s.id !== "tab-" + name; });
  history.replaceState(null, "", "#" + name);
  if (!loaded[name]) { loaded[name] = true; ({ products: loadProducts, orders: loadOrders, subscribers: loadSubs, texts: loadTexts })[name](); }
}
$("tabs").addEventListener("click", e => { const b = e.target.closest("button[data-tab]"); if (b) openTab(b.dataset.tab); });

// ---------- товары ----------
let products = [];
let editing = null;     // исходный товар (null = новый)
let newImage = null;    // { blob, preview } — выбранное, но ещё не загруженное фото

Object.entries(CATS).forEach(([k, v]) => {
  $("prodCat").insertAdjacentHTML("beforeend", `<option value="${k}">${v}</option>`);
  $("fCat").insertAdjacentHTML("beforeend", `<option value="${k}">${v}</option>`);
});

async function loadProducts() {
  const { data, error } = await db.from("products").select("*").order("sort").order("name");
  if (error) return toast(errText(error), true);
  products = data;
  renderProducts();
}

function renderProducts() {
  const q = $("prodSearch").value.trim().toLowerCase();
  const cat = $("prodCat").value;
  const list = products.filter(p => (!cat || p.category === cat) &&
    (!q || [p.name, p.name_ru, p.name_hy].join(" ").toLowerCase().includes(q)));
  $("prodCount").textContent = `${products.length}`;
  $("prodTable").tBodies[0].innerHTML = list.map(p => {
    const tags = [
      !p.active && `<i class="tag off">Скрыт</i>`,
      p.best && `<i class="tag">Хит</i>`,
      p.is_new && `<i class="tag">Новинка</i>`,
      p.gift && `<i class="tag">Подарок</i>`,
    ].filter(Boolean).join("");
    const stock = p.stock == null ? `<span class="muted">—</span>` : p.stock === 0 ? `<b class="bad">0</b>` : p.stock;
    return `<tr data-name="${esc(p.name)}" tabindex="0" class="${p.active ? "" : "dim"}">
      <td class="thumb">${p.img ? `<img src="${esc(imgUrl(p.img))}" alt="" loading="lazy">` : ""}</td>
      <td><b>${esc(p.name)}</b>${p.name_ru ? `<br><span class="muted">${esc(p.name_ru)}</span>` : ""}</td>
      <td>${esc(CATS[p.category] || p.category || "")}</td>
      <td class="num">${money(p.price)}</td>
      <td class="num">${stock}</td>
      <td>${tags}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="empty">Ничего не найдено</td></tr>`;
}
$("prodSearch").addEventListener("input", renderProducts);
$("prodCat").addEventListener("change", renderProducts);
$("prodTable").addEventListener("click", e => {
  const tr = e.target.closest("tr[data-name]");
  if (tr) openEditor(products.find(p => p.name === tr.dataset.name));
});
$("prodTable").addEventListener("keydown", e => {
  const tr = e.target.closest("tr[data-name]");
  if (tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openEditor(products.find(p => p.name === tr.dataset.name)); }
});
$("addProduct").addEventListener("click", () => openEditor(null));

const F = {
  name: "fName", name_ru: "fNameRu", name_hy: "fNameHy", mat_en: "fMatEn", mat_ru: "fMatRu", mat_hy: "fMatHy",
  category: "fCat", price: "fPrice", stock: "fStock", sort: "fSort",
};
const CHECKS = { active: "fActive", best: "fBest", is_new: "fNew", gift: "fGift" };

function setPhoto(src) {
  $("edPhoto").innerHTML = src ? `<img src="${esc(src)}" alt="">` : `<span>Нет фото</span>`;
}

function openEditor(p) {
  editing = p;
  newImage = null;
  $("edFile").value = "";
  const maxSort = products.reduce((m, x) => Math.max(m, x.sort || 0), 0);
  const v = p || { category: "rings", active: true, sort: maxSort + 10 };
  Object.entries(F).forEach(([k, id]) => { $(id).value = v[k] ?? ""; });
  Object.entries(CHECKS).forEach(([k, id]) => { $(id).checked = !!v[k]; });
  setPhoto(imgUrl(v.img));
  $("edTitle").textContent = p ? p.name : "Новый товар";
  $("edDelete").hidden = !p;
  $("edMsg").textContent = "";
  $("editor").showModal();
  $("fName").focus();
}
const closeEditor = () => { if (newImage) URL.revokeObjectURL(newImage.preview); newImage = null; $("editor").close(); };
$("edClose").addEventListener("click", closeEditor);
$("edCancel").addEventListener("click", closeEditor);

// Уменьшаем фото до 1600px, чтобы сайт грузился быстро.
function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      c.toBlob(b => (b ? resolve(b) : reject(new Error("Не удалось обработать фото."))), "image/jpeg", 0.86);
    };
    img.onerror = () => reject(new Error("Этот файл не похож на фото."));
    img.src = URL.createObjectURL(file);
  });
}
$("edFile").addEventListener("change", async () => {
  const file = $("edFile").files[0];
  if (!file) return;
  try {
    const blob = await shrink(file);
    if (newImage) URL.revokeObjectURL(newImage.preview);
    newImage = { blob, preview: URL.createObjectURL(blob) };
    setPhoto(newImage.preview);
  } catch (e) { $("edMsg").textContent = e.message; }
});

async function uploadImage(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  const path = `${Date.now()}-${slug}.jpg`;
  const { error } = await db.storage.from(BUCKET).upload(path, newImage.blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

$("prodForm").addEventListener("submit", async e => {
  e.preventDefault();
  const val = id => $(id).value.trim();
  const row = {
    name: val("fName"),
    name_ru: val("fNameRu") || null, name_hy: val("fNameHy") || null,
    mat_en: val("fMatEn") || null, mat_ru: val("fMatRu") || null, mat_hy: val("fMatHy") || null,
    category: $("fCat").value,
    price: Number($("fPrice").value),
    stock: val("fStock") === "" ? null : Math.max(0, Math.floor(Number(val("fStock")))),
    sort: val("fSort") === "" ? 1000 : Math.floor(Number(val("fSort"))),
    updated_at: new Date().toISOString(),
  };
  Object.entries(CHECKS).forEach(([k, id]) => { row[k] = $(id).checked; });
  if (!row.name) return ($("edMsg").textContent = "Впишите название на английском.");
  if (!(row.price >= 0) || $("fPrice").value === "") return ($("edMsg").textContent = "Укажите цену.");
  if (!newImage && !(editing && editing.img)) return ($("edMsg").textContent = "Загрузите фото товара.");

  $("edSave").disabled = true;
  $("edMsg").textContent = "Сохраняем…";
  try {
    if (newImage) row.img = await uploadImage(row.name);
    const q = editing ? db.from("products").update(row).eq("name", editing.name) : db.from("products").insert(row);
    const { error } = await q;
    if (error) throw error;
    closeEditor();
    toast(editing ? "Товар сохранён" : "Товар добавлен");
    loadProducts();
  } catch (err) {
    $("edMsg").textContent = errText(err);
  } finally {
    $("edSave").disabled = false;
  }
});

$("edDelete").addEventListener("click", async () => {
  if (!editing) return;
  if (!confirm(`Удалить «${editing.name}» навсегда? Если хотите только убрать с сайта, снимите галочку «Показывать на сайте».`)) return;
  const { error } = await db.from("products").delete().eq("name", editing.name);
  if (error) return ($("edMsg").textContent = errText(error));
  closeEditor();
  toast("Товар удалён");
  loadProducts();
});

// ---------- заказы ----------
let orders = [];
let orderStatus = "new";

async function loadOrders() {
  const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) return toast(errText(error), true);
  orders = data;
  renderOrders();
}

function renderOrders() {
  const counts = { all: orders.length };
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  $("newBadge").textContent = counts.new || "";
  $("newBadge").hidden = !counts.new;
  $("orderFilter").innerHTML = [["all", "Все"], ...Object.entries(STATUSES)].map(([k, v]) =>
    `<button type="button" data-st="${k}" class="${k === orderStatus ? "on" : ""}">${v} <b>${counts[k] || 0}</b></button>`).join("");
  const list = orders.filter(o => orderStatus === "all" || o.status === orderStatus);
  $("orderList").innerHTML = list.map(o => `
    <article class="order st-${o.status}">
      <header>
        <b>№${o.id}</b><span class="muted">${fmtDate(o.created_at)}</span>
        <span class="grow"></span><b>${money(o.total)}</b>
        <select data-id="${o.id}" aria-label="Статус заказа №${o.id}">${Object.entries(STATUSES).map(([k, v]) =>
          `<option value="${k}"${k === o.status ? " selected" : ""}>${v}</option>`).join("")}</select>
      </header>
      <div class="order-body">
        <div>
          <div><b>${esc(o.customer_name)}</b></div>
          <div><a href="tel:${esc(o.phone.replace(/[^\d+]/g, ""))}">${esc(o.phone)}</a></div>
          ${o.email ? `<div><a href="mailto:${esc(o.email)}">${esc(o.email)}</a></div>` : ""}
          ${o.address ? `<div>${esc(o.address)}</div>` : ""}
          ${o.comment ? `<div class="comment">«${esc(o.comment)}»</div>` : ""}
        </div>
        <ul>${(o.items || []).map(i => `<li><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}</ul>
      </div>
    </article>`).join("") || `<p class="empty">Здесь пока нет заказов.</p>`;
}
$("orderFilter").addEventListener("click", e => {
  const b = e.target.closest("button[data-st]");
  if (b) { orderStatus = b.dataset.st; renderOrders(); }
});
$("orderList").addEventListener("change", async e => {
  const sel = e.target.closest("select[data-id]");
  if (!sel) return;
  const id = Number(sel.dataset.id);
  const { error } = await db.from("orders").update({ status: sel.value }).eq("id", id);
  if (error) { toast(errText(error), true); return loadOrders(); }
  orders.find(o => o.id === id).status = sel.value;
  toast(`Заказ №${id}: ${STATUSES[sel.value].toLowerCase()}`);
  renderOrders();
  if (loaded.products) loadProducts(); // отмена возвращает товары на склад
});
$("reloadOrders").addEventListener("click", loadOrders);

// ---------- подписчики ----------
let subs = [];
async function loadSubs() {
  const { data, error } = await db.from("subscribers").select("*").order("created_at", { ascending: false });
  if (error) return toast(errText(error), true);
  subs = data;
  $("subCount").textContent = subs.length;
  $("subTable").tBodies[0].innerHTML = subs.map(s => `<tr>
    <td>${esc(s.email)}</td><td>${esc((s.lang || "").toUpperCase())}</td><td>${fmtDate(s.created_at)}</td>
    <td class="num"><button type="button" class="link danger" data-email="${esc(s.email)}">Удалить</button></td>
  </tr>`).join("") || `<tr><td colspan="4" class="empty">Подписчиков пока нет.</td></tr>`;
}
$("subTable").addEventListener("click", async e => {
  const b = e.target.closest("button[data-email]");
  if (!b || !confirm(`Удалить ${b.dataset.email} из рассылки?`)) return;
  const { error } = await db.from("subscribers").delete().eq("email", b.dataset.email);
  if (error) return toast(errText(error), true);
  toast("Подписчик удалён");
  loadSubs();
});
$("exportSubs").addEventListener("click", () => {
  const csv = "email,lang,created_at\n" + subs.map(s => [s.email, s.lang || "", s.created_at].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
  a.download = `concha-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ---------- тексты сайта ----------
const LANGS = [["ru", "Русский"], ["en", "English"], ["hy", "Հայերեն"]];
const TEXT_GROUPS = [
  ["Верхняя полоса", k => /^top\d/.test(k)],
  ["Меню", k => k.startsWith("nav_") || k === "menu"],
  ["Главный экран", k => k.startsWith("hero_")],
  ["Категории", k => /^c_/.test(k) || k === "dd_view_all" || k === "filter_cat"],
  ["Хиты", k => k === "best_title" || k === "view_all"],
  ["Материалы", k => /^m_/.test(k)],
  ["О нас", k => k.startsWith("story_") || k.startsWith("alt_")],
  ["Наши обещания", k => k === "promise_title" || /^pr\d/.test(k)],
  ["Рассылка", k => k.startsWith("sub_")],
  ["Подвал сайта", k => k.startsWith("f_") || /^s\d$/.test(k) || k.startsWith("copy") || k === "credit"],
  ["Корзина и заказ", k => k.startsWith("cart_") || k.startsWith("order_") || k === "sold_out"],
  ["Регистрация и вход", k => k.startsWith("auth_")],
  ["Прочее", () => true],
];
let overrides = {};   // key → { ru, en, hy } из базы
const dirty = new Set();
const plain = html => String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();

async function loadTexts() {
  const { data, error } = await db.from("site_texts").select("*");
  if (error) return toast(errText(error), true);
  overrides = Object.fromEntries(data.map(r => [r.key, r]));
  dirty.clear();
  renderTexts();
}

function renderTexts() {
  const keys = Object.keys(I18N.ru);
  const used = new Set();
  $("textGroups").innerHTML = TEXT_GROUPS.map(([title, test], gi) => {
    const ks = keys.filter(k => !used.has(k) && test(k));
    ks.forEach(k => used.add(k));
    if (!ks.length) return "";
    return `<details class="tgroup" ${gi < 3 ? "open" : ""}><summary>${title} <span class="muted">${ks.length}</span></summary>` +
      ks.map(k => {
        const o = overrides[k];
        return `<div class="trow${o ? " changed" : ""}" data-key="${k}">
          <div class="tlabel"><b>${esc(plain(I18N.ru[k]).slice(0, 70) || k)}</b>
            ${o ? `<button type="button" class="link" data-reset="${k}">Вернуть исходный</button>` : ""}</div>
          <div class="tfields">${LANGS.map(([l, ln]) => {
            const v = (o && o[l]) || I18N[l][k] || "";
            const long = (I18N.ru[k] || "").length > 60;
            return `<label><span>${ln}</span>${long
              ? `<textarea rows="3" data-l="${l}">${esc(v)}</textarea>`
              : `<input data-l="${l}" value="${esc(v)}">`}</label>`;
          }).join("")}</div>
        </div>`;
      }).join("") + `</details>`;
  }).join("");
  filterTexts();
  $("saveTexts").disabled = true;
  $("saveTexts").textContent = "Сохранить";
}
function filterTexts() {
  const q = $("textSearch").value.trim().toLowerCase();
  document.querySelectorAll(".trow").forEach(r => {
    const hay = [...r.querySelectorAll("input,textarea")].map(i => i.value).join(" ").toLowerCase();
    r.hidden = !!q && !hay.includes(q);
  });
  document.querySelectorAll(".tgroup").forEach(g => {
    const any = [...g.querySelectorAll(".trow")].some(r => !r.hidden);
    g.hidden = !any;
    if (q && any) g.open = true;
  });
}
$("textSearch").addEventListener("input", filterTexts);
$("textGroups").addEventListener("input", e => {
  const row = e.target.closest(".trow");
  if (!row) return;
  dirty.add(row.dataset.key);
  row.classList.add("edited");
  $("saveTexts").disabled = false;
  $("saveTexts").textContent = `Сохранить (${dirty.size})`;
});
$("textGroups").addEventListener("click", async e => {
  const b = e.target.closest("button[data-reset]");
  if (!b || !confirm("Вернуть исходный текст на всех трёх языках?")) return;
  const { error } = await db.from("site_texts").delete().eq("key", b.dataset.reset);
  if (error) return toast(errText(error), true);
  toast("Исходный текст возвращён");
  loadTexts();
});
$("saveTexts").addEventListener("click", async () => {
  const rows = [...dirty].map(key => {
    const row = { key, updated_at: new Date().toISOString() };
    document.querySelectorAll(`.trow[data-key="${key}"] [data-l]`).forEach(f => {
      const v = f.value.trim();
      row[f.dataset.l] = v && v !== I18N[f.dataset.l][key] ? v : null; // совпадает с исходным — не храним
    });
    return row;
  });
  const reset = rows.filter(r => !r.ru && !r.en && !r.hy).map(r => r.key);
  const save = rows.filter(r => r.ru || r.en || r.hy);
  $("saveTexts").disabled = true;
  try {
    if (save.length) { const { error } = await db.from("site_texts").upsert(save); if (error) throw error; }
    if (reset.length) { const { error } = await db.from("site_texts").delete().in("key", reset); if (error) throw error; }
    toast("Тексты сохранены. Обновите сайт, чтобы увидеть.");
    loadTexts();
  } catch (err) {
    toast(errText(err), true);
    $("saveTexts").disabled = false;
  }
});

start().catch(e => { show("loginView"); setLoginMsg(errText(e), true); });
