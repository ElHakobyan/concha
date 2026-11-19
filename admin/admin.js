// Админка Perla: товары, заказы, подписчики и тексты сайта.
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

const cfg = window.PERLA_BACKEND || {};
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
  await detectFeatures();
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

// Глаз рядом с паролем: показать / скрыть.
document.querySelectorAll(".pw .eye").forEach(btn => btn.addEventListener("click", () => {
  const input = btn.previousElementSibling;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.setAttribute("aria-pressed", show);
  btn.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
  input.focus();
}));

// ---------- вкладки ----------
const loaded = {};
function openTab(name) {
  if (!$("tab-" + name) || $("tab-" + name).dataset.needs === "v2" && !features.v2) name = "products";
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".main > section").forEach(s => { s.hidden = s.id !== "tab-" + name; });
  history.replaceState(null, "", "#" + name);
  if (!loaded[name]) { loaded[name] = true; ({ products: loadProducts, orders: loadOrders, customers: loadCustomers, subscribers: loadSubs, texts: loadTexts,
    promos: loadPromos, banners: loadBanners, analytics: loadAnalytics })[name](); }
}
$("tabs").addEventListener("click", e => { const b = e.target.closest("button[data-tab]"); if (b) openTab(b.dataset.tab); });

// ---------- какие файлы базы уже запущены ----------
// Админка работает и до запуска новых SQL-файлов: недостающие поля и вкладки просто прячутся.
const features = { gold: false, v2: false, accounts: false };
let goldRate = null;   // { rate_24k, purity, markup } из gold_settings
async function detectFeatures() {
  const has = async (table, cols) => !(await db.from(table).select(cols).limit(1)).error;
  [features.gold, features.v2] = await Promise.all([
    has("products", "weight,pricing"),
    has("products", "desc_ru,images,archived").then(ok => ok && has("promotions", "id")),
  ]);
  if (features.gold) {
    const { data } = await db.from("gold_settings").select("rate_24k,purity,markup").eq("id", 1).maybeSingle();
    goldRate = data && data.rate_24k ? data : null;
  }
  document.querySelectorAll("[data-needs=gold]").forEach(el => { el.hidden = !features.gold; });
  document.querySelectorAll("[data-needs=v2]").forEach(el => { el.hidden = !features.v2; });
  document.querySelectorAll("[data-needs-not=v2]").forEach(el => { el.hidden = features.v2; });
  if (features.v2) loadPromos();
}

// ---------- скидки ----------
let promos = [];
let editingPromo = null;
const promoState = p => {
  const now = Date.now();
  if (!p.active) return ["off", "Выключена"];
  if (new Date(p.starts_at) > now) return ["soon", "Запланирована"];
  if (p.ends_at && new Date(p.ends_at) <= now) return ["over", "Закончилась"];
  return ["on", "Идёт"];
};
// Скидка в %, которая действует на товар сейчас (как в базе: берётся самая большая).
function discountFor(p) {
  return promos.filter(x => promoState(x)[0] === "on" && (x.scope === "all" ||
    (x.scope === "category" && x.category === p.category) ||
    (x.scope === "products" && (x.products || []).includes(p.name))))
    .reduce((m, x) => Math.max(m, Number(x.percent)), 0);
}
async function loadPromos() {
  const { data, error } = await db.from("promotions").select("*").order("starts_at", { ascending: false });
  if (error) return toast(errText(error), true);
  promos = data;
  renderPromos();
  if (products.length) renderProducts();
}
const dShort = d => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
function renderPromos() {
  $("promoList").innerHTML = promos.map(p => {
    const [st, stText] = promoState(p);
    const what = p.scope === "all" ? "Все товары" : p.scope === "category" ? `Категория: ${CATS[p.category] || p.category}` :
      `Товары: ${(p.products || []).slice(0, 4).map(esc).join(", ")}${(p.products || []).length > 4 ? ` и ещё ${(p.products || []).length - 4}` : ""}`;
    return `<article class="promo st-${st}" data-id="${p.id}" tabindex="0">
      <div class="promo-pct">−${Number(p.percent)}%</div>
      <div class="promo-info"><b>${esc(p.name)}</b><div class="muted">${what}</div>
        <div class="muted">${dShort(p.starts_at)} — ${p.ends_at ? dShort(new Date(new Date(p.ends_at) - 1)) : "без срока"}</div></div>
      <i class="tag ${st}">${stText}</i>
    </article>`;
  }).join("") || `<p class="empty">Скидок пока нет. Нажмите «Новая скидка».</p>`;
}
const toDateInput = d => { const x = new Date(d); return new Date(x - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
function openPromo(p) {
  editingPromo = p;
  if (!products.length) loadProducts().then(() => fillPromoProducts(p));
  $("pName").value = p ? p.name : "";
  $("pPercent").value = p ? Number(p.percent) : "";
  $("pScope").value = p ? p.scope : "all";
  $("pCat").innerHTML = Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  $("pCat").value = (p && p.category) || "rings";
  $("pStart").value = toDateInput(p ? p.starts_at : new Date());
  $("pEnd").value = p && p.ends_at ? toDateInput(new Date(new Date(p.ends_at) - 1)) : "";
  $("pActive").checked = p ? p.active : true;
  fillPromoProducts(p);
  promoScopeUi();
  $("pDelete").hidden = !p;
  $("pMsg").textContent = "";
  $("promoDlg").showModal();
  $("pName").focus();
}
function fillPromoProducts(p) {
  const chosen = new Set(p ? p.products || [] : []);
  $("pProducts").innerHTML = products.filter(x => !x.archived).map(x =>
    `<label><input type="checkbox" value="${esc(x.name)}"${chosen.has(x.name) ? " checked" : ""}> ${esc(x.name_ru || x.name)}</label>`).join("");
}
function promoScopeUi() {
  $("pCatWrap").hidden = $("pScope").value !== "category";
  $("pProductsWrap").hidden = $("pScope").value !== "products";
}
$("pScope").addEventListener("change", promoScopeUi);
$("addPromo").addEventListener("click", () => openPromo(null));
$("promoList").addEventListener("click", e => { const a = e.target.closest("[data-id]"); if (a) openPromo(promos.find(p => p.id === +a.dataset.id)); });
$("promoList").addEventListener("keydown", e => { const a = e.target.closest("[data-id]"); if (a && e.key === "Enter") openPromo(promos.find(p => p.id === +a.dataset.id)); });
$("pCancel").addEventListener("click", () => $("promoDlg").close());
$("pClose").addEventListener("click", () => $("promoDlg").close());
$("promoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const localDay = (s, addDays = 0) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d + addDays); };
  const row = {
    name: $("pName").value.trim(),
    percent: Number($("pPercent").value),
    scope: $("pScope").value,
    category: $("pScope").value === "category" ? $("pCat").value : null,
    products: $("pScope").value === "products" ? [...$("pProducts").querySelectorAll("input:checked")].map(i => i.value) : [],
    starts_at: $("pStart").value ? localDay($("pStart").value).toISOString() : new Date().toISOString(),
    ends_at: $("pEnd").value ? localDay($("pEnd").value, 1).toISOString() : null,   // включительно: до конца этого дня
    active: $("pActive").checked,
  };
  if (!row.name) return ($("pMsg").textContent = "Дайте скидке название, например «Чёрная пятница».");
  if (!(row.percent > 0 && row.percent < 100)) return ($("pMsg").textContent = "Скидка — от 1 до 99 %.");
  if (row.scope === "products" && !row.products.length) return ($("pMsg").textContent = "Отметьте хотя бы один товар.");
  if (row.ends_at && new Date(row.ends_at) <= new Date(row.starts_at)) return ($("pMsg").textContent = "Дата окончания должна быть позже начала.");
  const q = editingPromo ? db.from("promotions").update(row).eq("id", editingPromo.id) : db.from("promotions").insert(row);
  const { error } = await q;
  if (error) return ($("pMsg").textContent = errText(error));
  $("promoDlg").close();
  toast(editingPromo ? "Скидка сохранена" : "Скидка создана");
  loadPromos();
});
$("pDelete").addEventListener("click", async () => {
  if (!editingPromo || !confirm(`Удалить скидку «${editingPromo.name}»? Цены сразу вернутся к обычным.`)) return;
  const { error } = await db.from("promotions").delete().eq("id", editingPromo.id);
  if (error) return ($("pMsg").textContent = errText(error));
  $("promoDlg").close();
  toast("Скидка удалена");
  loadPromos();
});

// ---------- баннеры (слайды на главной) ----------
let banners = [];
async function loadBanners() {
  const { data, error } = await db.from("banners").select("*").order("sort").order("id");
  if (error) return toast(errText(error), true);
  banners = data;
  renderBanners();
}
function renderBanners() {
  $("bannerList").innerHTML = banners.map((b, i) => `
    <article class="banner${b.active ? "" : " dim"}" data-id="${b.id}">
      <div class="banner-img" style="background-image:url('${esc(imgUrl(b.img))}');background-size:${b.size === "cover" ? "cover" : "contain"}"></div>
      <div class="banner-ctl">
        <b>Слайд ${i + 1}</b>
        <label><input type="checkbox" data-act="active"${b.active ? " checked" : ""}> Показывать</label>
        <select data-act="size" aria-label="Как показывать"><option value="cover"${b.size === "cover" ? " selected" : ""}>Заполнить баннер</option><option value="auto 100%"${b.size !== "cover" ? " selected" : ""}>Целиком по высоте</option></select>
        <span class="grow"></span>
        <button type="button" class="btn ghost sm" data-act="up"${i === 0 ? " disabled" : ""} aria-label="Выше">↑</button>
        <button type="button" class="btn ghost sm" data-act="down"${i === banners.length - 1 ? " disabled" : ""} aria-label="Ниже">↓</button>
        <button type="button" class="link danger" data-act="del">Удалить</button>
      </div>
    </article>`).join("") || `<p class="empty">Баннеров нет — на сайте будут слайды по умолчанию.</p>`;
}
async function saveBanner(id, patch) {
  const { error } = await db.from("banners").update(patch).eq("id", id);
  if (error) { toast(errText(error), true); return false; }
  return true;
}
$("bannerList").addEventListener("change", async e => {
  const el = e.target.closest("[data-act]"); const card = e.target.closest("[data-id]");
  if (!el || !card) return;
  const patch = el.dataset.act === "active" ? { active: el.checked } : { size: el.value };
  if (await saveBanner(+card.dataset.id, patch)) { toast("Сохранено"); loadBanners(); }
});
$("bannerList").addEventListener("click", async e => {
  const el = e.target.closest("button[data-act]"); const card = e.target.closest("[data-id]");
  if (!el || !card) return;
  const i = banners.findIndex(b => b.id === +card.dataset.id);
  if (el.dataset.act === "del") {
    if (!confirm("Удалить этот слайд с сайта?")) return;
    const { error } = await db.from("banners").delete().eq("id", banners[i].id);
    if (error) return toast(errText(error), true);
    toast("Слайд удалён");
    return loadBanners();
  }
  const j = el.dataset.act === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= banners.length) return;
  const order = banners.slice(); [order[i], order[j]] = [order[j], order[i]];
  for (let k = 0; k < order.length; k++) if (order[k].sort !== (k + 1) * 10) await saveBanner(order[k].id, { sort: (k + 1) * 10 });
  loadBanners();
});
$("bannerFile").addEventListener("change", async () => {
  const file = $("bannerFile").files[0];
  if (!file) return;
  try {
    toast("Загружаем слайд…");
    const blob = await shrink(file, 2000);
    const url = await uploadImage("banner", blob, "banners/");
    const sort = banners.reduce((m, b) => Math.max(m, b.sort), 0) + 10;
    const { error } = await db.from("banners").insert({ img: url, size: "cover", sort });
    if (error) throw error;
    toast("Слайд добавлен");
    loadBanners();
  } catch (err) { toast(errText(err), true); }
  $("bannerFile").value = "";
});

// ---------- аналитика ----------
let anOrders = [];
async function loadAnalytics() {
  const { data, error } = await db.from("orders").select("id,created_at,status,items,total").order("created_at", { ascending: false }).limit(5000);
  if (error) return toast(errText(error), true);
  anOrders = data;
  if (!products.length) await loadProducts();
  renderAnalytics();
}
function renderAnalytics() {
  const days = Number($("anPeriod").value);
  const from = days ? Date.now() - days * 86400000 : 0;
  const inPeriod = anOrders.filter(o => new Date(o.created_at) >= from);
  const sold = inPeriod.filter(o => o.status !== "cancelled");
  const revenue = sold.reduce((s, o) => s + Number(o.total), 0);
  const items = sold.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + Number(i.qty), 0), 0);
  $("anKpis").innerHTML = [
    ["Заказов", inPeriod.length, inPeriod.length - sold.length ? `из них отменено ${inPeriod.length - sold.length}` : ""],
    ["Продажи", money(revenue), "без отменённых"],
    ["Средний чек", sold.length ? money(revenue / sold.length) : "—", ""],
    ["Продано украшений", items, ""],
  ].map(([k, v, s]) => `<div class="kpi"><span>${k}</span><b>${v}</b>${s ? `<small>${s}</small>` : ""}</div>`).join("");

  // продажи по дням (или по месяцам для «всё время»)
  const byMonth = !days || days > 90;
  const key = d => { const x = new Date(d); return byMonth ? `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}` : x.toISOString().slice(0, 10); };
  const buckets = [];
  if (byMonth) {
    const first = sold.length ? new Date(sold[sold.length - 1].created_at) : new Date();
    for (let d = new Date(first.getFullYear(), first.getMonth(), 1); d <= new Date(); d.setMonth(d.getMonth() + 1)) buckets.push(key(d));
  } else {
    for (let k = days - 1; k >= 0; k--) buckets.push(key(Date.now() - k * 86400000));
  }
  const sums = Object.fromEntries(buckets.map(b => [b, 0]));
  sold.forEach(o => { const k = key(o.created_at); if (k in sums) sums[k] += Number(o.total); });
  const max = Math.max(1, ...Object.values(sums));
  const label = b => byMonth ? new Date(b + "-01").toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }) : new Date(b).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const every = Math.ceil(buckets.length / 10);
  $("anChart").innerHTML = buckets.map((b, i) => `
    <div class="bar" title="${label(b)}: ${money(sums[b])}">
      <i style="height:${(sums[b] / max) * 100}%"></i>
      <span>${i % every === 0 ? label(b) : ""}</span>
    </div>`).join("");
  $("anChartTitle").textContent = byMonth ? "Продажи по месяцам" : "Продажи по дням";

  // популярные товары
  const top = {};
  sold.forEach(o => (o.items || []).forEach(i => {
    const t = top[i.name] || (top[i.name] = { qty: 0, sum: 0 });
    t.qty += Number(i.qty); t.sum += Number(i.qty) * Number(i.price);
  }));
  const rows = Object.entries(top).sort((a, b) => b[1].qty - a[1].qty || b[1].sum - a[1].sum).slice(0, 10);
  const byName = Object.fromEntries(products.map(p => [p.name, p]));
  $("anTop").tBodies[0].innerHTML = rows.map(([n, t], i) => {
    const p = byName[n];
    return `<tr><td class="num muted">${i + 1}</td>
      <td class="thumb">${p && p.img ? `<img src="${esc(imgUrl(p.img))}" alt="" loading="lazy">` : ""}</td>
      <td><b>${esc(n)}</b>${p && p.name_ru ? `<br><span class="muted">${esc(p.name_ru)}</span>` : ""}</td>
      <td class="num">${t.qty}</td><td class="num">${money(t.sum)}</td></tr>`;
  }).join("") || `<tr><td colspan="5" class="empty">За этот период продаж нет.</td></tr>`;

  // по статусам
  const st = {};
  inPeriod.forEach(o => { st[o.status] = (st[o.status] || 0) + 1; });
  $("anStatus").innerHTML = Object.entries(STATUSES).map(([k, v]) => `<li><span>${v}</span><b>${st[k] || 0}</b></li>`).join("");
}
$("anPeriod").addEventListener("change", renderAnalytics);

// ---------- товары ----------
let products = [];
let editing = null;     // исходный товар (null = новый)
let photos = [];        // [{ url }] уже загруженные или [{ blob, preview }] новые; первое — главное фото
let prodView = "active"; // active | archive

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
  const inArchive = p => !!p.archived;
  const list = products.filter(p => (prodView === "archive") === inArchive(p) && (!cat || p.category === cat) &&
    (!q || [p.name, p.name_ru, p.name_hy].join(" ").toLowerCase().includes(q)));
  const nArch = products.filter(inArchive).length;
  $("prodCount").textContent = `${products.length - nArch}`;
  $("prodViewArchive").textContent = `Архив (${nArch})`;
  $("prodViewArchive").hidden = !features.v2;
  document.querySelectorAll("#prodViews button").forEach(b => b.classList.toggle("on", b.dataset.view === prodView));
  $("prodTable").tBodies[0].innerHTML = list.map(p => {
    const extra = (p.images || []).length;
    const tags = [
      p.archived && `<i class="tag off">В архиве</i>`,
      !p.active && !p.archived && `<i class="tag off">Скрыт</i>`,
      p.best && `<i class="tag">Хит</i>`,
      p.is_new && `<i class="tag">Новинка</i>`,
      p.gift && `<i class="tag">Подарок</i>`,
      discountFor(p) > 0 && `<i class="tag sale">−${discountFor(p)}%</i>`,
    ].filter(Boolean).join("");
    const stock = p.stock == null ? `<span class="muted">—</span>` : p.stock === 0 ? `<b class="bad">0</b>` : p.stock;
    return `<tr data-name="${esc(p.name)}" tabindex="0" class="${p.active && !p.archived ? "" : "dim"}">
      <td class="thumb">${p.img ? `<img src="${esc(imgUrl(p.img))}" alt="" loading="lazy">` : ""}${extra ? `<small class="more">+${extra}</small>` : ""}</td>
      <td><b>${esc(p.name)}</b>${p.name_ru ? `<br><span class="muted">${esc(p.name_ru)}</span>` : ""}</td>
      <td>${esc(CATS[p.category] || p.category || "")}</td>
      <td class="num">${money(p.price)}${p.pricing === "gold" ? `<br><small class="muted">по курсу</small>` : ""}</td>
      <td class="num">${stock}</td>
      <td>${tags}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="empty">${prodView === "archive" ? "В архиве пусто" : "Ничего не найдено"}</td></tr>`;
}
$("prodSearch").addEventListener("input", renderProducts);
$("prodCat").addEventListener("change", renderProducts);
$("prodViews").addEventListener("click", e => {
  const b = e.target.closest("button[data-view]");
  if (b) { prodView = b.dataset.view; renderProducts(); }
});
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
const F_GOLD = { weight: "fWeight", pricing: "fPricing" };
const F_V2 = { desc_en: "fDescEn", desc_ru: "fDescRu", desc_hy: "fDescHy" };
const CHECKS = { active: "fActive", best: "fBest", is_new: "fNew", gift: "fGift" };
const fieldMap = () => ({ ...F, ...(features.gold ? F_GOLD : {}), ...(features.v2 ? F_V2 : {}) });

function renderPhotos() {
  const box = $("edPhotos");
  if (!photos.length) { box.innerHTML = `<div class="photo"><span>Нет фото</span></div>`; return; }
  box.innerHTML = photos.map((ph, i) => `
    <div class="ph${i === 0 ? " main" : ""}">
      <img src="${esc(ph.preview || imgUrl(ph.url))}" alt="">
      ${i === 0 ? `<span class="ph-badge">Главное</span>` : `<button type="button" class="ph-btn" data-main="${i}" title="Сделать главным">★</button>`}
      ${features.v2 || i > 0 || photos.length > 1 ? `<button type="button" class="ph-btn ph-del" data-del="${i}" title="Убрать фото">✕</button>` : ""}
    </div>`).join("");
}
$("edPhotos").addEventListener("click", e => {
  const m = e.target.closest("[data-main]"), d = e.target.closest("[data-del]");
  if (m) { const [ph] = photos.splice(+m.dataset.main, 1); photos.unshift(ph); renderPhotos(); }
  if (d) { const [ph] = photos.splice(+d.dataset.del, 1); if (ph.preview) URL.revokeObjectURL(ph.preview); renderPhotos(); }
});

function goldEstimate() {
  const w = Number($("fWeight").value);
  const gold = features.gold && $("fPricing").value === "gold";
  $("fPrice").closest("label").classList.toggle("muted", gold && !!goldRate);
  if (!gold) { $("goldHint").textContent = ""; return; }
  if (!goldRate) { $("goldHint").textContent = "Курс золота ещё не загружен, поэтому укажите цену вручную. Она пересчитается сама, когда курс появится."; return; }
  $("goldHint").textContent = w > 0 ? `Цена по сегодняшнему курсу: ${money(Math.round(w * goldRate.rate_24k * goldRate.purity * (1 + Number(goldRate.markup))))}. Поле «Цена» можно не заполнять.` : "Укажите вес — цена посчитается сама.";
}
["fWeight", "fPricing"].forEach(id => $(id).addEventListener("input", goldEstimate));

function openEditor(p) {
  editing = p;
  photos.forEach(ph => ph.preview && URL.revokeObjectURL(ph.preview));
  photos = p ? [p.img, ...(p.images || [])].filter(Boolean).map(url => ({ url })) : [];
  $("edFile").value = "";
  const maxSort = products.reduce((m, x) => Math.max(m, x.sort || 0), 0);
  const v = p || { category: "rings", active: true, sort: maxSort + 10, pricing: "gold" };
  Object.entries({ ...F, ...F_GOLD, ...F_V2 }).forEach(([k, id]) => { $(id).value = v[k] ?? ""; });
  if (!$("fPricing").value) $("fPricing").value = "fixed";
  Object.entries(CHECKS).forEach(([k, id]) => { $(id).checked = !!v[k]; });
  renderPhotos();
  $("edTitle").textContent = p ? p.name : "Новый товар";
  const archived = !!(p && p.archived);
  $("edArchive").hidden = !p || archived || !features.v2;
  $("edRestore").hidden = !archived;
  $("edDelete").hidden = !p || (features.v2 && !archived);
  $("edDelete").textContent = features.v2 ? "Удалить навсегда" : "Удалить товар";
  $("edMsg").textContent = "";
  goldEstimate();
  $("editor").showModal();
  $("fName").focus();
}
const closeEditor = () => {
  photos.forEach(ph => ph.preview && URL.revokeObjectURL(ph.preview));
  photos = [];
  $("editor").close();
};
$("edClose").addEventListener("click", closeEditor);
$("edCancel").addEventListener("click", closeEditor);

// Уменьшаем фото, чтобы сайт грузился быстро.
function shrink(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
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
  const files = [...$("edFile").files];
  if (!files.length) return;
  // Без admin-v2.sql у товара может быть только одно фото: новое заменяет старое.
  if (!features.v2) { photos.forEach(ph => ph.preview && URL.revokeObjectURL(ph.preview)); photos = []; files.length = 1; }
  for (const file of files) {
    try {
      const blob = await shrink(file);
      photos.push({ blob, preview: URL.createObjectURL(blob) });
    } catch (e) { $("edMsg").textContent = e.message; }
  }
  $("edFile").value = "";
  renderPhotos();
});

async function uploadImage(name, blob, prefix = "") {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${slug}.jpg`;
  const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
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
    price: Number($("fPrice").value || 0),
    stock: val("fStock") === "" ? null : Math.max(0, Math.floor(Number(val("fStock")))),
    sort: val("fSort") === "" ? 1000 : Math.floor(Number(val("fSort"))),
    updated_at: new Date().toISOString(),
  };
  if (features.gold) {
    row.weight = val("fWeight") === "" ? null : Number(val("fWeight"));
    row.pricing = $("fPricing").value;
  }
  if (features.v2) {
    row.desc_en = val("fDescEn") || null; row.desc_ru = val("fDescRu") || null; row.desc_hy = val("fDescHy") || null;
  }
  Object.entries(CHECKS).forEach(([k, id]) => { row[k] = $(id).checked; });
  const gold = features.gold && row.pricing === "gold";
  if (!row.name) return ($("edMsg").textContent = "Впишите название на английском.");
  if (gold && !(row.weight > 0)) return ($("edMsg").textContent = "Для расчёта по курсу золота укажите вес.");
  if ((!gold || !goldRate) && (!(row.price > 0) || $("fPrice").value === "")) return ($("edMsg").textContent = "Укажите цену.");
  if (!photos.length) return ($("edMsg").textContent = "Загрузите хотя бы одно фото товара.");

  $("edSave").disabled = true;
  $("edMsg").textContent = "Сохраняем…";
  try {
    for (const ph of photos) {
      if (ph.blob) { ph.url = await uploadImage(row.name, ph.blob); URL.revokeObjectURL(ph.preview); delete ph.blob; delete ph.preview; }
    }
    row.img = photos[0].url;
    if (features.v2) row.images = photos.slice(1).map(ph => ph.url);
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

async function setArchived(p, archived) {
  const { error } = await db.from("products").update({ archived, archived_at: archived ? new Date().toISOString() : null }).eq("name", p.name);
  if (error) return ($("edMsg").textContent = errText(error));
  closeEditor();
  toast(archived ? "Товар перенесён в архив. Его можно вернуть." : "Товар возвращён из архива");
  loadProducts();
}
$("edArchive").addEventListener("click", () => editing && setArchived(editing, true));
$("edRestore").addEventListener("click", () => editing && setArchived(editing, false));

$("edDelete").addEventListener("click", async () => {
  if (!editing) return;
  if (!confirm(`Удалить «${editing.name}» навсегда? Вернуть его будет нельзя. Старые заказы с ним сохранятся.`)) return;
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
  const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(1000);
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
        <ul>${(o.items || []).map(i => `<li><span>${esc(i.name)} × ${i.qty}${i.discount ? ` <i class="tag sale">−${Number(i.discount)}%</i>` : ""}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}</ul>
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

// ---------- клиенты (зарегистрированные на сайте) ----------
let customers = [];
async function loadCustomers() {
  let { data, error } = await db.from("profiles").select("first_name,last_name,email,phone,created_at").order("created_at", { ascending: false });
  // До запуска accounts.sql в таблице ещё старая колонка full_name и нет email.
  if (error) ({ data, error } = await db.from("profiles").select("*").order("created_at", { ascending: false }));
  if (error) {
    $("custTable").tBodies[0].innerHTML = `<tr><td colspan="5" class="empty">Список клиентов появится после запуска файла accounts.sql в Supabase.</td></tr>`;
    return;
  }
  customers = data.map(c => ({ ...c, first_name: c.first_name ?? c.full_name }));
  renderCustomers();
}
function renderCustomers() {
  const q = $("custSearch").value.trim().toLowerCase();
  const list = customers.filter(c => !q || [c.first_name, c.last_name, c.email, c.phone].some(v => (v || "").toLowerCase().includes(q)));
  $("custCount").textContent = customers.length;
  $("custTable").tBodies[0].innerHTML = list.map(c => `<tr>
    <td>${esc(c.first_name || "—")}</td><td>${esc(c.last_name || "—")}</td>
    <td>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "—"}</td>
    <td>${c.phone ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a>` : "—"}</td>
    <td>${fmtDate(c.created_at)}</td>
  </tr>`).join("") || `<tr><td colspan="5" class="empty">${q ? "Никого не нашли." : "Клиентов пока нет."}</td></tr>`;
}
$("custSearch").addEventListener("input", renderCustomers);
$("exportCust").addEventListener("click", () => {
  const cols = ["first_name", "last_name", "email", "phone", "created_at"];
  const csv = cols.join(",") + "\n" + customers.map(c => cols.map(k => `"${String(c[k] || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
  a.download = `perla-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

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
  a.download = `perla-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
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
