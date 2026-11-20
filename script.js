const products = [
  { name: "Aurelia Ring", mat: "m_vermeil", price: 100, img: "assets/p1.jpg", cat: "c_rings", best: true },
  { name: "Lumin Pearl Drops", mat: "m_pearls", price: 128, img: "assets/p2.jpg", cat: "c_earrings", best: true },
  { name: "Sentinel Pendant", mat: "m_vermeil", price: 80, img: "assets/p3.jpg", cat: "c_necklaces", best: true },
  { name: "Forma Cuff", mat: "m_vermeil", price: 160, img: "assets/p4.jpg", cat: "c_bracelets", best: true },
  { name: "Moment Chain", mat: "m_fill", price: 70, img: "assets/p5.jpg", cat: "c_chains", best: true },
  { name: "Ora Hoops", mat: "m_vermeil", price: 100, img: "assets/p6.jpg", cat: "c_earrings", best: true },
  { name: "Selene Band", mat: "m_gold", price: 174, g: 2.0, img: "assets/catalog/rings-1.jpg", cat: "c_rings" },
  { name: "Lyra Leaf Ring", mat: "m_gold", price: 156, g: 1.8, img: "assets/catalog/rings-2.jpg", cat: "c_rings" },
  { name: "Thalia Ring", mat: "m_gold", price: 174, g: 2.0, img: "assets/catalog/rings-3.jpg", cat: "c_rings" },
  { name: "Iris Filigree Ring", mat: "m_gold", price: 261, g: 3.0, img: "assets/catalog/rings-4.jpg", cat: "c_rings" },
  { name: "Daphne Ring", mat: "m_gold", price: 243, g: 2.8, img: "assets/catalog/rings-5.jpg", cat: "c_rings" },
  { name: "Aura Signet", mat: "m_gold", price: 304, g: 3.5, img: "assets/catalog/rings-6.jpg", cat: "c_rings" },
  { name: "Nyx Hoops", mat: "m_gold", price: 261, g: 3.0, img: "assets/catalog/earrings-1.jpg", cat: "c_earrings" },
  { name: "Mira Hoops", mat: "m_gold", price: 156, g: 1.8, img: "assets/catalog/earrings-2.jpg", cat: "c_earrings" },
  { name: "Luna Crescents", mat: "m_gold", price: 434, g: 5.0, img: "assets/catalog/earrings-3.jpg", cat: "c_earrings" },
  { name: "Ariadne Drops", mat: "m_gold", price: 608, g: 7.0, img: "assets/catalog/earrings-4.jpg", cat: "c_earrings" },
  { name: "Eros Hoops", mat: "m_gold", price: 191, g: 2.2, img: "assets/catalog/earrings-5.jpg", cat: "c_earrings" },
  { name: "Taurus Studs", mat: "m_gold", price: 217, g: 2.5, img: "assets/catalog/earrings-6.jpg", cat: "c_earrings" },
  { name: "Aria Thread", mat: "m_gold", price: 304, g: 3.5, img: "assets/catalog/necklaces-1.jpg", cat: "c_necklaces" },
  { name: "Calypso Chain", mat: "m_gold", price: 1043, g: 12, img: "assets/catalog/necklaces-2.jpg", cat: "c_necklaces" },
  { name: "Hestia Collar", mat: "m_gold", price: 2172, g: 25, img: "assets/catalog/necklaces-3.jpg", cat: "c_necklaces" },
  { name: "Dione Fringe", mat: "m_gold", price: 695, g: 8, img: "assets/catalog/necklaces-4.jpg", cat: "c_necklaces" },
  { name: "Rhea Beads", mat: "m_gold", price: 1912, g: 22, img: "assets/catalog/necklaces-5.jpg", cat: "c_necklaces" },
  { name: "Phoebe Pendants", mat: "m_gold", price: 1564, g: 18, img: "assets/catalog/necklaces-6.jpg", cat: "c_necklaces" },
  { name: "Echo Serpent", mat: "m_gold", price: 1912, g: 22, img: "assets/catalog/bracelets-1.jpg", cat: "c_bracelets" },
  { name: "Gaia Cuff", mat: "m_gold", price: 1738, g: 20, img: "assets/catalog/bracelets-2.jpg", cat: "c_bracelets" },
  { name: "Twin Bangles", mat: "m_gold", price: 1217, g: 14, img: "assets/catalog/bracelets-3.jpg", cat: "c_bracelets" },
  { name: "Carnelian Twist", mat: "m_gold", price: 2607, g: 30, img: "assets/catalog/bracelets-4.jpg", cat: "c_bracelets" },
  { name: "Ember Bands", mat: "m_gold", price: 2607, g: 30, img: "assets/catalog/bracelets-5.jpg", cat: "c_bracelets" },
  { name: "Thread Band", mat: "m_gold", price: 521, g: 6, img: "assets/catalog/bracelets-6.jpg", cat: "c_bracelets" },
  { name: "Wisp Chain", mat: "m_gold", price: 695, g: 8, img: "assets/catalog/chains-1.jpg", cat: "c_chains" },
  { name: "Silk Chain", mat: "m_gold", price: 869, g: 10, img: "assets/catalog/chains-2.jpg", cat: "c_chains" },
  { name: "Amber Drop Chain", mat: "m_gold", price: 782, g: 9, img: "assets/catalog/chains-3.jpg", cat: "c_chains" },
  { name: "Pendant Chain", mat: "m_gold", price: 608, g: 7, img: "assets/catalog/chains-4.jpg", cat: "c_chains" },
  { name: "Clasp Chain", mat: "m_gold", price: 869, g: 10, img: "assets/catalog/chains-5.jpg", cat: "c_chains" },
  { name: "Trio Chain", mat: "m_gold", price: 348, g: 4, img: "assets/catalog/chains-6.jpg", cat: "c_chains" },
];

const LANGS = ["hy", "ru", "en"];
let lang = "ru";
let goldDate = null;
try {
  const saved = localStorage.getItem("lang");
  if (LANGS.includes(saved)) lang = saved;
} catch (e) {}

const t = key => I18N[lang][key] ?? I18N.ru[key] ?? key;
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Название и материал товара на текущем языке (из админки), иначе — как в коде.
const pName = p => (p.names && p.names[lang]) || p.name;
const pMat = p => ((p.mats && p.mats[lang]) || t(p.mat));
const soldOut = p => p.stock === 0;
const pDesc = p => (p.descs && (p.descs[lang] || p.descs.en || p.descs.ru)) || "";
// Цена со скидкой: старая зачёркнута.
const priceHtml = p => p.oldPrice ? `<s class="old">$${p.oldPrice.toFixed(2)}</s> <span class="sale">$${p.price.toFixed(2)}</span>` : `$${p.price.toFixed(2)}`;

const grid = document.getElementById("products");
const count = document.getElementById("count");

let query = "";
let catFilter = null;
const noResults = document.getElementById("noresults");

function renderProducts() {
  const q = query.trim().toLowerCase();
  // ищем сразу по всем языкам (hy/ru/en)
  const hay = p => `${p.name} ${LANGS.map(l => `${(p.names && p.names[l]) || ""} ${(p.mats && p.mats[l]) || I18N[l][p.mat] || ""} ${I18N[l][p.cat]}`).join(" ")}`.toLowerCase();
  const pool = (catFilter || q) ? products : products.filter(p => p.best);
  const list = pool.filter(p => (!catFilter || p.tags.includes(catFilter)) && (!q || hay(p).includes(q)));
  noResults.hidden = list.length > 0;
  updateFilterbar();
  grid.innerHTML = list.map(p => `
    <article class="card">
      <div class="img" data-open="${esc(p.name)}"><img src="${esc(p.img)}" alt="${esc(pName(p))}">${soldOut(p) ? `<span class="soldout">${t("sold_out")}</span>` : p.discount ? `<span class="soldout salebadge">−${p.discount}%</span>` : ""}${(p.images || []).length ? `<span class="morephotos">+${p.images.length}</span>` : ""}</div>
      <div class="meta">
        <div class="name" data-open="${esc(p.name)}">${esc(pName(p))}</div>
        <div class="mat">${esc(pMat(p))}</div>
        <div class="row"><span>${priceHtml(p)}</span>
          <button class="add" data-name="${esc(p.name)}" aria-label="${t("cart_add")}: ${esc(pName(p))}"${soldOut(p) ? ` disabled title="${t("sold_out")}"` : ""}>+</button></div>
      </div>
    </article>`).join("");
}

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-alt]").forEach(el => { el.alt = t(el.dataset.i18nAlt); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.setAttribute("title", t(el.dataset.i18nTitle)); });
  document.querySelector('meta[name="description"]').content = t("meta_desc");
  showRateNote();
  document.querySelectorAll(".langs button").forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
  renderProducts();
  renderCart();
  renderCats();
  renderAuth();
  setMusicUi();
  if (window.heroSlidesRelabel) window.heroSlidesRelabel();
}

const searchBtn = document.getElementById("searchBtn");
const searchbar = document.getElementById("searchbar");
const qInput = document.getElementById("q");

function openSearch(open) {
  searchbar.hidden = !open;
  searchBtn.setAttribute("aria-expanded", open);
  if (open) qInput.focus();
  else if (query) { query = ""; qInput.value = ""; renderProducts(); }
}
searchBtn.addEventListener("click", () => openSearch(searchbar.hidden));
document.getElementById("qclose").addEventListener("click", () => openSearch(false));
searchbar.addEventListener("submit", e => { e.preventDefault(); document.getElementById("bestsellers").scrollIntoView(); });
qInput.addEventListener("input", () => {
  query = qInput.value;
  renderProducts();
  document.getElementById("bestsellers").scrollIntoView({ behavior: "smooth" });
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !searchbar.hidden) { openSearch(false); searchBtn.focus(); } });

const langsBox = document.querySelector(".langs");
langsBox.addEventListener("click", e => {
  const b = e.target.closest("button[data-lang]");
  if (!b) return;
  // на телефоне нажатие на текущий язык открывает/закрывает список
  if (b.dataset.lang === lang && matchMedia("(max-width: 600px)").matches) {
    langsBox.classList.toggle("open");
    return;
  }
  langsBox.classList.remove("open");
  lang = b.dataset.lang;
  try { localStorage.setItem("lang", lang); } catch (err) {}
  applyLang();
});
document.addEventListener("click", e => { if (!e.target.closest(".langs")) langsBox.classList.remove("open"); });

// ---------- корзина ----------
let cart = {};
try { cart = JSON.parse(localStorage.getItem("cart") || "{}") || {}; } catch (e) { cart = {}; }
const byName = name => products.find(p => p.name === name);
const money = v => "$" + v.toFixed(2);
const cartEl = document.getElementById("cart");
const overlay = document.getElementById("overlay");
const cartBtn = document.getElementById("cartBtn");
const cartItems = document.getElementById("cartItems");
const cartMsg = document.getElementById("cartMsg");
const orderForm = document.getElementById("orderForm");
const orderFields = document.getElementById("orderFields");
const checkoutBtn = document.getElementById("checkout");
let sendingOrder = false;
let cartMsgState = null;    // { key, ok, vars } — чтобы сообщение переводилось при смене языка

function setCartMsg(key, ok = true, vars = {}) {
  cartMsgState = key ? { key, ok, vars } : null;
  cartMsg.className = "msg " + (ok ? "ok" : "err");
  cartMsg.textContent = key ? t(key).replace(/\{(\w+)\}/g, (m, v) => vars[v] ?? m) : "";
}

function saveCart() { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {} }

function renderCart() {
  const names = Object.keys(cart).filter(k => byName(k) && cart[k] > 0);
  const qty = names.reduce((s, k) => s + cart[k], 0);
  const total = names.reduce((s, k) => s + cart[k] * byName(k).price, 0);
  count.textContent = qty > 0 ? String(qty) : "";
  count.hidden = qty === 0;
  document.getElementById("cartTotal").textContent = money(total);
  checkoutBtn.disabled = qty === 0 || sendingOrder;
  if (qty === 0) orderFields.hidden = true;
  checkoutBtn.textContent = t(orderFields.hidden ? "cart_checkout" : "order_send");
  if (cartMsgState) setCartMsg(cartMsgState.key, cartMsgState.ok, cartMsgState.vars);
  cartItems.innerHTML = names.length ? names.map(k => {
    const p = byName(k);
    return `<div class="cart-item">
      <img src="${esc(p.img)}" alt="">
      <div class="ci-info"><div class="ci-name">${esc(pName(p))}</div><div class="ci-mat">${esc(pMat(p))}</div>
        <div class="ci-qty"><button type="button" data-act="dec" data-name="${esc(p.name)}" aria-label="-">−</button><span>${cart[k]}</span><button type="button" data-act="inc" data-name="${esc(p.name)}" aria-label="+">+</button></div></div>
      <div class="ci-side"><b>${money(cart[k] * p.price)}</b><button type="button" class="ci-rm" data-act="rm" data-name="${esc(p.name)}">${t("cart_remove")}</button></div>
    </div>`;
  }).join("") : `<p class="cart-empty">${t("cart_empty")}</p>`;
}

function openCart(open) {
  cartEl.classList.toggle("open", open);
  cartEl.setAttribute("aria-hidden", !open);
  overlay.hidden = !open;
  cartBtn.setAttribute("aria-expanded", open);
  if (open) { if (!sendingOrder) setCartMsg(null); document.getElementById("cartClose").focus(); }
}

function addToCart(name) {
  const p = byName(name);
  if (!p || soldOut(p) || (p.stock != null && (cart[name] || 0) >= p.stock)) return;
  cart[name] = (cart[name] || 0) + 1;
  saveCart(); renderCart();
}

grid.addEventListener("click", e => {
  const b = e.target.closest("button.add");
  if (b) {
    if (b.disabled) return;
    addToCart(b.dataset.name);
    b.classList.add("added"); b.textContent = "✓"; b.setAttribute("title", t("cart_added"));
    setTimeout(() => { b.classList.remove("added"); b.textContent = "+"; b.removeAttribute("title"); }, 1200);
    openCart(true);
    return;
  }
  const o = e.target.closest("[data-open]");
  if (o) openProduct(o.dataset.open);
});
cartBtn.addEventListener("click", () => openCart(!cartEl.classList.contains("open")));
document.getElementById("cartClose").addEventListener("click", () => openCart(false));
overlay.addEventListener("click", () => openCart(false));
cartItems.addEventListener("click", e => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const k = b.dataset.name;
  if (b.dataset.act === "inc") { const p = byName(k); if (p && p.stock != null && cart[k] >= p.stock) return; cart[k]++; }
  if (b.dataset.act === "dec") cart[k]--;
  if (b.dataset.act === "rm" || cart[k] <= 0) delete cart[k];
  saveCart(); renderCart();
});
// ---------- бэкенд (Supabase) ----------
// Настройки подключения — в config.js. Сайт вызывает только две функции из
// supabase/schema.sql: place_order (заказ) и subscribe (рассылка).
async function backend(fn, args) {
  const cfg = window.PERLA_BACKEND || {};
  const fail = code => Object.assign(new Error(code), { code });
  if (!cfg.url || !cfg.anonKey) throw fail("not_configured");
  // Если покупатель вошёл — передаём его токен, чтобы заказ привязался к аккаунту («Мои заказы»).
  // getSession() сам обновляет просроченный токен.
  let token = null;
  if (sb && session) { try { const { data } = await sb.auth.getSession(); token = data.session && data.session.access_token; } catch (e) {} }
  const call = tok => fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: Object.assign({ apikey: cfg.anonKey, "Content-Type": "application/json" }, tok ? { Authorization: "Bearer " + tok } : {}),
    body: JSON.stringify(args),
  });
  let res;
  try {
    res = await call(token);
    // Токен не приняли (истёк/отозван) — не теряем заказ, отправляем как гость.
    if (res.status === 401 && token) res = await call(null);
  } catch (e) { throw fail("network"); }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw fail((data && data.message) || "http_" + res.status);
  return data;
}

const ORDER_ERRORS = {
  bad_name: "order_err_name", bad_phone: "order_err_phone", bad_email: "order_err_email",
  unknown_product: "order_err_product", bad_qty: "order_err_product", not_configured: "order_err_offline",
  out_of_stock: "order_err_stock",
};
const isPhone = v => /^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, ""));
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

orderForm.addEventListener("submit", async e => {
  e.preventDefault();
  const names = Object.keys(cart).filter(k => byName(k) && cart[k] > 0);
  if (!names.length || sendingOrder) return;
  if (orderFields.hidden) {           // первый клик: показываем поля для контактов
    orderFields.hidden = false; setCartMsg(null); renderCart();
    document.getElementById("oName").focus();
    return;
  }
  const val = id => document.getElementById(id).value.trim();
  const order = {
    p_name: val("oName"), p_phone: val("oPhone"), p_email: val("oEmail").toLowerCase(),
    p_address: val("oAddress"), p_comment: val("oComment"), p_lang: lang,
    p_items: names.map(k => ({ name: k, qty: cart[k] })),
  };
  if (!order.p_name) return setCartMsg("order_err_name", false);
  if (!isPhone(order.p_phone)) return setCartMsg("order_err_phone", false);
  if (!isEmail(order.p_email)) return setCartMsg("order_err_email", false);

  sendingOrder = true; setCartMsg("order_sending"); renderCart();
  try {
    const id = await backend("place_order", order);
    cart = {}; saveCart(); orderForm.reset(); orderFields.hidden = true;
    setCartMsg("cart_done", true, { id });
    if (session) loadMyOrders().then(renderAuth);
  } catch (err) {
    setCartMsg(ORDER_ERRORS[err.code] || "order_err_net", false);
  } finally {
    sendingOrder = false; renderCart();
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && cartEl.classList.contains("open")) { openCart(false); cartBtn.focus(); } });

const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); });

// ---------- регистрация / вход (Supabase Auth) ----------
// Аккаунты хранятся в Supabase: пароль проверяет сервер, в браузере его нет.
// Профиль (имя, фамилия, телефон) лежит в таблице profiles, каждый видит только свой.
const authDlg = document.getElementById("auth");
const authForm = document.getElementById("authForm");
const authMsg = document.getElementById("authMsg");
// Сообщения формы администратора (отдельно от формы покупателя).
const adminForm = document.getElementById("adminForm");
const adminMsg = document.getElementById("adminMsg");
let adminBusy = false, adminMsgKey = null;
const userBtn = document.getElementById("userBtn");
const profileMenu = document.getElementById("profileMenu");
const profileEmail = document.getElementById("profileEmail");
function closeProfileMenu() { profileMenu.hidden = true; userBtn.setAttribute("aria-expanded", "false"); }
let authMode = "register";          // register | login | reset (новый пароль по ссылке из письма)
let authBusy = false;
let authView = "user";            // choose | user | admin — какое окно показать гостю
let session = null, profile = null;
let isAdmin = false;                // только для показа кнопки «Открыть админку»; права всё равно проверяет база

// Старый демо-режим хранил аккаунты в браузере. Убираем эти данные.
try { localStorage.removeItem("users"); localStorage.removeItem("session"); } catch (e) {}

// Что пришло в адресе после перехода по ссылке из письма (supabase-js потом очищает адрес).
const authHash = new URLSearchParams(location.hash.slice(1));
const authLinkType = authHash.get("type");          // signup | recovery | ...
const authLinkError = authHash.get("error_code") || authHash.get("error");

const authCfg = window.PERLA_BACKEND || {};
const sb = window.supabase && authCfg.url && authCfg.anonKey
  ? window.supabase.createClient(authCfg.url, authCfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
const siteUrl = () => location.origin + location.pathname;

function currentUser() {
  if (!session) return null;
  const u = session.user, m = u.user_metadata || {}, p = profile || {};
  return { email: u.email, name: p.first_name || m.first_name || "", surname: p.last_name || m.last_name || "", phone: p.phone || m.phone || "" };
}

async function loadProfile() {
  if (!sb || !session) { profile = null; return renderAuth(); }
  const { data } = await sb.from("profiles").select("first_name,last_name,phone").eq("id", session.user.id).maybeSingle();
  profile = data || null;
  // Есть ли права администратора — спрашиваем у базы (is_admin), сама страница ничего не решает.
  try { const { data: adm } = await sb.rpc("is_admin"); isAdmin = adm === true; }
  catch (e) { isAdmin = false; }
  await loadMyOrders();
  renderAuth();
  prefillOrder();
}

// «Мои заказы»: только заказы этого аккаунта. Фильтр по user_id нужен и для админа
// (ему база отдаёт все заказы), а чужие заказы покупателю не отдаст сама база (RLS).
// Пока колонки user_id нет (не запущен supabase/my-orders.sql) — раздел просто скрыт.
let myOrders = null;
async function loadMyOrders() {
  myOrders = null;
  if (!sb || !session) return;
  try {
    const { data, error } = await sb.from("orders").select("id,created_at,status,items,total")
      .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(30);
    if (!error) myOrders = data || [];
  } catch (e) { myOrders = null; }
}

function renderMyOrders() {
  const box = document.getElementById("myOrders");
  if (!box) return;
  box.hidden = !currentUser() || myOrders === null;
  if (box.hidden) return;
  document.getElementById("moEmpty").hidden = myOrders.length > 0;
  const list = document.getElementById("moList");
  list.textContent = "";
  const locale = { hy: "hy-AM", ru: "ru-RU", en: "en-US" }[lang] || "ru-RU";
  myOrders.forEach(o => {
    const li = document.createElement("li"); li.className = "mo-item";
    const top = document.createElement("div"); top.className = "mo-top";
    const no = document.createElement("b"); no.textContent = t("orders_no").replace("{id}", o.id);
    const st = document.createElement("span"); st.className = "mo-st " + o.status; st.textContent = t("st_" + o.status);
    top.append(no, st);
    const date = document.createElement("div"); date.className = "mo-date";
    date.textContent = new Date(o.created_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    const lines = document.createElement("div"); lines.className = "mo-lines";
    (Array.isArray(o.items) ? o.items : []).forEach((it, i) => {
      const p = products.find(x => x.name === it.name);
      if (i) lines.append(document.createElement("br"));
      lines.append(`${p ? pName(p) : it.name} × ${it.qty}`);
    });
    const total = document.createElement("div"); total.className = "mo-total";
    total.textContent = `${t("orders_total")}: ${money(Number(o.total))}`;
    li.append(top, date, lines, total);
    list.append(li);
  });
}

// Если покупатель вошёл, подставляем его данные в форму заказа (только пустые поля).
function prefillOrder() {
  const u = currentUser();
  if (!u) return;
  const fill = (id, v) => { const el = document.getElementById(id); if (el && !el.value && v) el.value = v; };
  fill("oName", `${u.name} ${u.surname}`.trim());
  fill("oPhone", u.phone);
  fill("oEmail", u.email);
}

let lastPane = null;
function renderAuth() {
  const user = currentUser();
  const mode = user && authMode !== "reset" ? "account" : authMode;
  const reg = mode === "register", reset = mode === "reset";
  // Какое окно видно: аккаунт, выбор роли, форма покупателя или форма администратора.
  const pane = "user";
  authForm.hidden = pane !== "user";
  adminForm.hidden = pane !== "admin";
  
  document.getElementById("authBack").hidden = true;
  const title = pane === "choose" ? "" : pane === "admin" ? "auth_admin_title" : mode === "account" ? "auth_account" : reset ? "auth_newpass" : reg ? "auth_register" : "auth_login";
  document.getElementById("authTitle").textContent = title ? t(title) : "";
  const sub = document.getElementById("authSub");
  sub.hidden = !(pane === "choose" || pane === "admin");
  sub.textContent = pane === "choose" ? t("auth_choose") : pane === "admin" ? t("auth_admin_sub") : "";
  if (pane !== lastPane) {
    const el = { account: "account", choose: "authChoose", user: "authForm", admin: "adminForm" }[pane];
    const node = document.getElementById(el);
    node.classList.remove("pane-in"); void node.offsetWidth; node.classList.add("pane-in");
    lastPane = pane;
  }
  const adSubmit = document.getElementById("adminSubmit");
  adSubmit.textContent = adminBusy ? t("auth_wait") : t("auth_sub_admin");
  adSubmit.disabled = adminBusy; adSubmit.classList.toggle("busy", adminBusy);
  if (adminMsgKey) adminMsg.textContent = t(adminMsgKey);
  if (authDlg.open) placeAuth();
  adminForm.querySelectorAll(".pw .eye").forEach(btn => btn.setAttribute("aria-label", t(btn.getAttribute("aria-pressed") === "true" ? "pw_hide" : "pw_show")));
  authForm.querySelector(".tabs").hidden = reset;
  authForm.querySelectorAll("[data-reg]").forEach(el => { el.hidden = !reg; });
  authForm.querySelectorAll("[data-login]").forEach(el => { el.hidden = mode !== "login"; });
  authForm.querySelectorAll("[data-email]").forEach(el => { el.hidden = reset; });
  authForm.querySelectorAll("[data-pass2]").forEach(el => { el.hidden = !(reg || reset); });
  authForm.querySelectorAll(".tabs button").forEach(b => {
    const on = b.dataset.mode === authMode;
    b.classList.toggle("on", on); b.setAttribute("aria-selected", on);
  });
  document.getElementById("aPassLabel").textContent = t(reset ? "auth_newpass_label" : "auth_pass");
  const submit = document.getElementById("authSubmit");
  submit.textContent = authBusy ? t("auth_wait") : t(reset ? "auth_sub_newpass" : reg ? "auth_sub_reg" : "auth_sub_login");
  submit.disabled = authBusy;
  submit.classList.toggle("busy", authBusy);
  document.getElementById("aPass").autocomplete = reg || reset ? "new-password" : "current-password";
  authForm.querySelectorAll(".pw .eye").forEach(btn => btn.setAttribute("aria-label", t(btn.getAttribute("aria-pressed") === "true" ? "pw_hide" : "pw_show")));
  const av = document.getElementById("avatar");
  av.textContent = user ? (user.name || user.email).trim().charAt(0).toUpperCase() : "";
  userBtn.classList.toggle("in", !!user);
  profileEmail.textContent = user ? user.email : "";
  if (!user) closeProfileMenu();
  if (authMsgKey) authMsg.textContent = t(authMsgKey);
}

let authMsgKey = null;
function setAuthMsg(key, ok) { authMsgKey = key || null; authMsg.className = "msg " + (ok ? "ok" : "err"); authMsg.textContent = key ? t(key) : ""; }

function setAdminMsg(key, ok) { adminMsgKey = key || null; adminMsg.className = "msg " + (ok ? "ok" : "err"); adminMsg.textContent = key ? t(key) : ""; }

function focusAuth() {
  const user = currentUser() && authMode !== "reset";
  const pane = "user";
  const first = pane === "choose" ? null
    : pane === "admin" ? "adEmail"
    : authMode === "register" ? "aName" : authMode === "reset" ? "aPass" : "aEmail";
  const el = first ? document.getElementById(first) : document.getElementById("aEmail");
  if (el) el.focus();
}

// keepMsg === true — открыть с уже готовым сообщением (после ссылки из письма) сразу на форме покупателя.
function openAuth(keepMsg) {
  if (keepMsg !== true) { setAuthMsg(""); setAdminMsg(""); authView = "user"; }
  else authView = "user";
  authDlg.classList.remove("closing");
  renderAuth();
  placeAuth();
  if (!authDlg.open) authDlg.showModal();
  placeAuth();   // второй раз — уже с настоящей шириной окна
  focusAuth();
}

// Окно открывается маленькой панелью прямо под иконкой аккаунта.
function placeAuth() {
  authDlg.classList.add("drop");
  const r = userBtn.getBoundingClientRect();
  authDlg.style.setProperty("--drop-top", Math.max(12, Math.round(r.bottom + 8)) + "px");
  // По центру под иконкой, но не выходя за края экрана.
  const w = authDlg.offsetWidth || 264;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
  authDlg.style.setProperty("--drop-left", Math.round(left) + "px");
}
addEventListener("resize", () => { if (authDlg.open) placeAuth(); });
addEventListener("scroll", () => { if (authDlg.open) placeAuth(); }, { passive: true });

// Плавное закрытие (Escape, крестик, клик по фону).
function closeAuth() {
  if (!authDlg.open || authDlg.classList.contains("closing")) return;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return authDlg.close();
  authDlg.classList.add("closing");
  setTimeout(() => { authDlg.classList.remove("closing"); authDlg.close(); }, 180);
}

function showAuthView(v) {
  authView = v; setAuthMsg(""); setAdminMsg("");
  if (v === "user" && authMode === "reset") authMode = "login";
  renderAuth(); focusAuth();
}

userBtn.addEventListener("click", () => {
  if (session && authMode !== "reset") {
    profileMenu.hidden = !profileMenu.hidden;
    userBtn.setAttribute("aria-expanded", String(!profileMenu.hidden));
  } else { closeProfileMenu(); openAuth(); }
});
document.getElementById("profileLogout").addEventListener("click", async () => {
  if (!sb) return;
  const btn = document.getElementById("profileLogout");
  btn.disabled = true;
  try {
    const { error } = await sb.auth.signOut();
    if (error) throw error;
    closeProfileMenu();
    session = null; profile = null; myOrders = null;
    renderAuth();
  } catch (err) { alert(err.message || "Sign out failed"); }
  finally { btn.disabled = false; }
});
document.addEventListener("click", e => { if (!profileMenu.hidden && !profileMenu.contains(e.target) && !userBtn.contains(e.target)) closeProfileMenu(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !profileMenu.hidden) { closeProfileMenu(); userBtn.focus(); } });
document.getElementById("authClose").addEventListener("click", closeAuth);
authDlg.addEventListener("click", e => { if (e.target === authDlg) closeAuth(); });
authDlg.addEventListener("cancel", e => { e.preventDefault(); closeAuth(); });
document.getElementById("authBack").addEventListener("click", () => showAuthView("choose"));
authForm.querySelector(".tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-mode]");
  if (!b) return;
  authMode = b.dataset.mode; setAuthMsg(""); renderAuth();
});

// ---------- вход администратора ----------
// Та же Supabase Auth, что и у покупателей. Выбор «As Admin» сам по себе ничего не даёт:
// после входа спрашиваем базу (is_admin), а каждую операцию в админке база проверяет ещё раз (RLS).
const adminUrl = () => new URL("admin/", siteUrl()).href;

adminForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (adminBusy) return;
  const email = document.getElementById("adEmail").value.trim().toLowerCase();
  const pw = document.getElementById("adPass").value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAdminMsg("auth_err_email");
  if (!pw) return setAdminMsg("auth_err_login");
  if (!sb) return setAdminMsg("auth_err_offline");
  setAdminMsg("");
  const wasSignedIn = !!session;
  adminBusy = true; renderAuth();
  try {
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    const { data: ok, error: rpcErr } = await sb.rpc("is_admin");
    if (rpcErr) throw rpcErr;
    if (ok === true) {
      isAdmin = true;
      setAdminMsg("auth_admin_go", true);
      location.href = adminUrl();
      return;
    }
    // Прав нет. Если до этого никто не был в аккаунте — выходим, чтобы не оставлять случайный вход.
    if (!wasSignedIn) { await sb.auth.signOut().catch(() => {}); setAdminMsg("auth_admin_denied"); }
    else setAdminMsg("auth_admin_denied_user");
    document.getElementById("adPass").value = "";
  } catch (err) { setAdminMsg(authErrKey(err)); }
  finally { adminBusy = false; renderAuth(); }
});

document.getElementById("adForgot").addEventListener("click", async () => {
  const email = document.getElementById("adEmail").value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAdminMsg("auth_err_forgot");
  if (!sb) return setAdminMsg("auth_err_offline");
  adminBusy = true; renderAuth();
  try {
    // Ссылка из письма ведёт в админку: там есть форма нового пароля.
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: adminUrl() });
    if (error) throw error;
    setAdminMsg("auth_reset_sent", true);
  } catch (err) { setAdminMsg(authErrKey(err)); }
  finally { adminBusy = false; renderAuth(); }
});

// Перевод ошибок Supabase в понятные сообщения.
function authErrKey(err) {
  const code = (err && (err.code || "")) + " " + ((err && err.message) || "");
  if (/invalid_credentials|Invalid login/i.test(code)) return "auth_err_login";
  if (/email_not_confirmed|not confirmed/i.test(code)) return "auth_err_confirm";
  if (/user_already_exists|already registered/i.test(code)) return "auth_err_exists";
  if (/rate_limit|rate limit|too many/i.test(code) || (err && err.status === 429)) return "auth_err_rate";
  if (/same_password|different from the old/i.test(code)) return "auth_err_same";
  if (/weak_password|password/i.test(code)) return "auth_err_pass";
  if (/fetch|network/i.test(code) || (err && err.status === 0)) return "auth_err_net";
  return "auth_err_net";
}

async function withBusy(fn) {
  authBusy = true; renderAuth();
  try { await fn(); }
  catch (err) { setAuthMsg(authErrKey(err)); }
  finally { authBusy = false; renderAuth(); }
}

document.getElementById("forgotBtn").addEventListener("click", () => {
  const email = document.getElementById("aEmail").value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthMsg("auth_err_forgot");
  if (!sb) return setAuthMsg("auth_err_offline");
  withBusy(async () => {
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() });
    if (error) throw error;
    setAuthMsg("auth_reset_sent", true);
  });
});

authForm.addEventListener("submit", async e => {
  e.preventDefault();
  if (authBusy) return;
  const name = document.getElementById("aName").value.trim();
  const surname = document.getElementById("aSurname").value.trim();
  const phone = document.getElementById("aPhone").value.trim();
  const email = document.getElementById("aEmail").value.trim().toLowerCase();
  const pw = document.getElementById("aPass").value;
  const pw2 = document.getElementById("aPass2").value;
  const reg = authMode === "register", reset = authMode === "reset";
  if (reg && !name) return setAuthMsg("auth_err_name");
  if (reg && !surname) return setAuthMsg("auth_err_surname");
  if (!reset && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthMsg("auth_err_email");
  if (reg && !/^\+?\d{7,15}$/.test(phone.replace(/[\s\-()]/g, ""))) return setAuthMsg("auth_err_phone");
  if ((reg || reset) && pw.length < 8) return setAuthMsg("auth_err_pass");
  if ((reg || reset) && pw !== pw2) return setAuthMsg("auth_err_match");
  if (!reg && !reset && !pw) return setAuthMsg("auth_err_login");
  if (!sb) return setAuthMsg("auth_err_offline");
  setAuthMsg("");
  await withBusy(async () => {
    if (reg) {
      const { data, error } = await sb.auth.signUp({
        email, password: pw,
        options: { emailRedirectTo: siteUrl(), data: { first_name: name, last_name: surname, phone } },
      });
      if (error) throw error;
      // Supabase не говорит прямо, что email занят: у такого пользователя нет identities.
      if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) return setAuthMsg("auth_err_exists");
      authForm.reset();
      if (!data.session) { authMode = "login"; document.getElementById("aEmail").value = email; return setAuthMsg("auth_check_email", true); }
    } else if (reset) {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      authForm.reset();
      authMode = "login";
      setAuthMsg("auth_pass_saved", true);
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      authForm.reset();
      setAuthMsg("");
      closeAuth();   // вошли — закрываем окно, иконка в шапке показывает аккаунт
    }
  });
});

if (sb) {
  sb.auth.onAuthStateChange((event, s) => {
    session = s || null;
    if (!session) { profile = null; isAdmin = false; myOrders = null; }
    if (event === "PASSWORD_RECOVERY") { authMode = "reset"; setTimeout(() => openAuth(), 0); }
    // Внутри этого обработчика нельзя ждать другие запросы Supabase — откладываем.
    setTimeout(loadProfile, 0);
  });
  if (authLinkType === "signup" && !authLinkError) {
    sb.auth.getSession().then(({ data }) => {
      if (data.session) { authMode = "login"; setAuthMsg("auth_confirmed", true); openAuth(true); }
    });
  }
}
if (authLinkError) {
  history.replaceState(null, "", location.pathname + location.search);
  authMode = "login";
  setTimeout(() => { setAuthMsg("auth_err_link"); openAuth(true); }, 0);
}

// ---------- фоновая музыка ----------
// Свой трек: положите файл в assets/ и впишите путь, например "assets/music.mp3".
// Пустая строка — сайт сам играет спокойную мелодию через Web Audio (без файлов).
const MUSIC_FILE = "";
const MUSIC_VOLUME = 0.22;
const musicBtn = document.getElementById("musicBtn");
let music = null;           // { ctx, master, analyser, stop() } или { audio, stop() }
let musicOn = false;

function createAmbient() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0;
  const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
  // простая «реверберация» из затухающего шума
  const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const verb = ctx.createConvolver(); verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = 0.55;
  const dry = ctx.createGain(); dry.gain.value = 0.7;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500; lp.Q.value = 0.4;
  lp.connect(dry); lp.connect(verb); verb.connect(wet);
  dry.connect(master); wet.connect(master); master.connect(analyser); analyser.connect(ctx.destination);

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const chords = [[48, 55, 64, 67], [45, 52, 60, 64], [41, 48, 57, 60], [43, 50, 59, 62]]; // Cmaj7 Am7 Fmaj7 G6
  const scale = [72, 74, 76, 79, 81, 84];                                                  // пентатоника C
  const CH = 9; let step = 0; const timers = [];

  function pad(midis, when, dur) {
    midis.forEach((m, k) => {
      [-5, 5].forEach(det => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = k % 2 ? "triangle" : "sine"; o.frequency.value = hz(m); o.detune.value = det;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.07, when + 3);
        g.gain.setValueAtTime(0.07, when + dur - 3);
        g.gain.linearRampToValueAtTime(0, when + dur + 2);
        o.connect(g); g.connect(lp); o.start(when); o.stop(when + dur + 2.2);
      });
    });
  }
  function bell() {
    const m = scale[Math.floor(Math.random() * scale.length)], t0 = ctx.currentTime + 0.05;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.09, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5);
    o.connect(g); g.connect(lp); o.start(t0); o.stop(t0 + 3.6);
  }
  function next() { pad(chords[step % chords.length], ctx.currentTime + 0.05, CH); step++; }
  next(); timers.push(setInterval(next, (CH - 2) * 1000));
  const bellLoop = () => { bell(); timers.push(setTimeout(bellLoop, 2500 + Math.random() * 4500)); };
  timers.push(setTimeout(bellLoop, 2500));
  return { ctx, master, analyser, stop() { timers.forEach(t => { clearInterval(t); clearTimeout(t); }); master.gain.cancelScheduledValues(0); master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); setTimeout(() => ctx.close(), 1500); } };
}

async function startMusic() {
  if (MUSIC_FILE) {
    const audio = new Audio(MUSIC_FILE); audio.loop = true; audio.volume = MUSIC_VOLUME;
    await audio.play();
    music = { audio, stop() { audio.pause(); } };
  } else {
    music = createAmbient();
    await music.ctx.resume();
    music.master.gain.setTargetAtTime(MUSIC_VOLUME, music.ctx.currentTime, 1.2); // плавное нарастание
  }
}
function setMusicUi() {
  musicBtn.classList.toggle("on", musicOn);
  musicBtn.setAttribute("aria-pressed", musicOn);
  musicBtn.setAttribute("aria-label", t(musicOn ? "music_off" : "music_on"));
}
musicBtn.addEventListener("click", async () => {
  try {
    if (!musicOn) { musicOn = true; setMusicUi(); await startMusic(); }
    else { musicOn = false; music && music.stop(); music = null; setMusicUi(); }
  } catch (e) { musicOn = false; music = null; setMusicUi(); }
});
document.addEventListener("visibilitychange", () => {
  if (!music || !musicOn) return;
  const c = music.ctx;
  if (c) { document.hidden ? c.suspend() : c.resume(); }
  else if (music.audio) { document.hidden ? music.audio.pause() : music.audio.play().catch(() => {}); }
});
// ---------- слайдшоу в главном экране ----------
// Чтобы добавить кадр, положите файл в assets/ и допишите его сюда.
// Кадры без файла пропускаются; при одном кадре управление скрыто.
const HERO_SLIDES = [
  { src: "assets/hero1.jpg", size: "auto 100%" },
  { src: "assets/hero2.jpg", size: "cover" },
  { src: "assets/hero3.jpg", size: "cover" },
  // Ещё кадры: положите файл в assets/ и раскомментируйте строку.
  { src: "assets/hero4.jpg", size: "cover" },
  // { src: "assets/hero5.jpg", size: "cover" },
];
// Слайды можно менять в админке (вкладка «Баннеры»); если база недоступна — берутся кадры выше.
async function heroSlidesList() {
  try {
    const rows = await Promise.race([
      backendGet("banners?select=img,size&order=sort.asc,id.asc"),
      new Promise(res => setTimeout(() => res(null), 2500)),
    ]);
    if (rows && rows.length) return rows.map(r => ({ src: r.img, size: r.size }));
  } catch (e) {}
  return HERO_SLIDES;
}
(async function initHeroSlides() {
  const SLIDES = await heroSlidesList();
  const box = document.getElementById("heroSlides");
  const ctrl = document.getElementById("heroCtrl");
  const dotsEl = document.getElementById("heroDots");
  const hero = document.getElementById("hero");
  const loaded = (await Promise.all(SLIDES.map(s => new Promise(res => {
    const img = new Image();
    img.onload = () => res(s); img.onerror = () => res(null);
    img.src = s.src;
  })))).filter(Boolean);
  if (!loaded.length) return;
  box.innerHTML = loaded.map(s => `<div class="slide" style="background-image:url('${esc(String(s.src).replace(/['"()\\\s]/g, encodeURIComponent))}');background-size:${s.size === "cover" ? "cover" : "auto 100%"}"></div>`).join("");
  const slides = [...box.children];
  let i = 0, timer = null, paused = false;
  const show = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((el, k) => el.classList.toggle("on", k === i));
    [...dotsEl.children].forEach((d, k) => d.setAttribute("aria-current", k === i));
  };
  show(0);
  if (slides.length < 2) return;           // один кадр — без управления
  dotsEl.innerHTML = slides.map((_, k) => `<button type="button" data-i="${k}"></button>`).join("");
  const labelDots = () => [...dotsEl.children].forEach((d, k) => d.setAttribute("aria-label", t("slide_go").replace("{n}", k + 1)));
  labelDots();
  window.heroSlidesRelabel = labelDots;     // вызывается при смене языка
  ctrl.hidden = false;
  show(0);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = () => { stop(); if (!reduce && !paused && !document.hidden) timer = setInterval(() => show(i + 1), 5500); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.getElementById("heroPrev").addEventListener("click", () => { show(i - 1); start(); });
  document.getElementById("heroNext").addEventListener("click", () => { show(i + 1); start(); });
  dotsEl.addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (b) { show(+b.dataset.i); start(); } });
  hero.addEventListener("mouseenter", () => { paused = true; stop(); });
  hero.addEventListener("mouseleave", () => { paused = false; start(); });
  hero.addEventListener("focusin", () => { paused = true; stop(); });
  hero.addEventListener("focusout", () => { paused = false; start(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  let x0 = null;
  hero.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); start(); }
  });
  start();
})();

// ---------- категории: выпадающие списки с товарами ----------
const CAT_ORDER = ["c_rings", "c_earrings", "c_necklaces", "c_bracelets", "c_chains", "c_new", "c_gifts"];
const NEW_ITEMS = ["Ora Hoops", "Moment Chain", "Lumin Pearl Drops", "Selene Band", "Luna Crescents", "Wisp Chain"];
const GIFT_ITEMS = ["Lumin Pearl Drops", "Sentinel Pendant", "Moment Chain", "Aria Thread", "Nyx Hoops", "Twin Bangles"];
const setTags = p => { p.tags = [p.cat].concat((p.isNew ?? NEW_ITEMS.includes(p.name)) ? ["c_new"] : [], (p.gift ?? GIFT_ITEMS.includes(p.name)) ? ["c_gifts"] : []); };
products.forEach(setTags);
const catsEl = document.getElementById("categories");
const filterbar = document.getElementById("filterbar");
let openCatKey = null, hoverTimer = null;

function renderCats() {
  catsEl.querySelectorAll(".cat").forEach(box => {
    const key = box.dataset.cat;
    const items = products.filter(p => p.tags.includes(key));
    box.querySelector(".dd").innerHTML = `<div class="dd-list" tabindex="0" role="list">` + items.map(p => `
      <div class="dd-item" role="listitem">
        <img src="${esc(p.img)}" alt="${esc(pName(p))}" loading="lazy" data-open="${esc(p.name)}">
        <div class="dd-info"><div class="dd-name"><button type="button" class="dd-open" data-open="${esc(p.name)}">${esc(pName(p))}</button></div><div class="dd-mat">${esc(pMat(p))}</div><div class="dd-price">${soldOut(p) ? t("sold_out") : priceHtml(p)}</div></div>
        <button type="button" class="dd-add" data-name="${esc(p.name)}" aria-label="${t("cart_add")}: ${esc(pName(p))}"${soldOut(p) ? " disabled" : ""}>+</button>
      </div>`).join("") + `</div><button type="button" class="dd-all" data-cat="${key}">${t("dd_view_all")}</button>`;
  });
  const cur = openCatKey; openCatKey = null; if (cur) setCat(cur, true);
}
function setCat(key, open) {
  catsEl.querySelectorAll(".cat").forEach(box => {
    const on = open && box.dataset.cat === key;
    box.classList.toggle("open", on);
    box.querySelector(".cat-btn").setAttribute("aria-expanded", on);
    box.querySelector(".dd").hidden = !on;
  });
  openCatKey = open ? key : null;
}
function updateFilterbar() {
  filterbar.hidden = !catFilter;
  if (catFilter) document.getElementById("filterLabel").textContent = t("filter_cat").replace("{name}", t(catFilter));
}
function setCatFilter(key) { catFilter = key; renderProducts(); }

catsEl.addEventListener("click", e => {
  const btn = e.target.closest(".cat-btn");
  if (btn) { const key = btn.closest(".cat").dataset.cat; setCat(key, openCatKey !== key); return; }
  const o = e.target.closest("[data-open]");
  if (o) { setCat(null, false); return openProduct(o.dataset.open); }
  const add = e.target.closest(".dd-add");
  if (add) {
    if (add.disabled) return;
    addToCart(add.dataset.name);
    add.classList.add("added"); add.textContent = "✓";
    setTimeout(() => { add.classList.remove("added"); add.textContent = "+"; }, 1200);
    return;
  }
  const all = e.target.closest(".dd-all");
  if (all) {
    setCatFilter(all.dataset.cat); setCat(null, false);
    document.getElementById("bestsellers").scrollIntoView({ behavior: "smooth" });
  }
});
if (window.matchMedia("(hover: hover)").matches) {
  catsEl.querySelectorAll(".cat").forEach(box => {
    box.addEventListener("mouseenter", () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => setCat(box.dataset.cat, true), 90); });
    box.addEventListener("mouseleave", () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => setCat(null, false), 160); });
  });
}
document.addEventListener("click", e => { if (openCatKey && !e.target.closest(".cat")) setCat(null, false); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && openCatKey) { const k = openCatKey; setCat(null, false); catsEl.querySelector(`.cat[data-cat="${k}"] .cat-btn`).focus(); }
});
document.getElementById("filterClear").addEventListener("click", () => setCatFilter(null));

applyLang();

// ---------- каталог и тексты из админки ----------
// Если бэкенд подключён (config.js), товары и изменённые тексты берутся из базы.
// Если нет или база недоступна — сайт показывает каталог из массива products выше.
function showRateNote() {
  const el = document.getElementById("rateNote");
  if (!el || !goldDate) return;
  el.textContent = t("rate_note").replace("{date}", goldDate.toLocaleDateString(lang === "ru" ? "ru-RU" : lang === "hy" ? "hy-AM" : "en-GB"));
  el.hidden = false;
}
const DB_CATS = { rings: "c_rings", earrings: "c_earrings", necklaces: "c_necklaces", bracelets: "c_bracelets", chains: "c_chains" };
async function backendGet(path) {
  const cfg = window.PERLA_BACKEND || {};
  if (!cfg.url || !cfg.anonKey) return null;
  const res = await fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/" + path, { headers: { apikey: cfg.anonKey } });
  if (!res.ok) throw new Error("http_" + res.status);
  return res.json();
}
(async function loadFromBackend() {
  try {
    const [rows, texts, promos] = await Promise.all([
      backendGet("products?select=*&active=is.true&order=sort.asc,name.asc"),
      backendGet("site_texts?select=key,ru,en,hy").catch(() => []),
      backendGet("promotions?select=percent,scope,category,products").catch(() => []),   // только идущие сейчас
    ]);
    const discountOf = r => (promos || []).filter(x => x.scope === "all" || (x.scope === "category" && x.category === r.category) ||
      (x.scope === "products" && (x.products || []).includes(r.name))).reduce((m, x) => Math.max(m, Number(x.percent)), 0);
    if (!rows) return;
    (texts || []).forEach(r => LANGS.forEach(l => { if (r[l]) I18N[l][r.key] = r[l]; }));
    // Пока admin.sql не запущен, у товаров нет фото — оставляем каталог из кода.
    if (rows.length && rows.every(r => r.img)) {
      const list = rows.filter(r => !r.archived).map(r => {
        const p = {
          name: r.name, price: Number(r.price), img: r.img, cat: DB_CATS[r.category] || "c_rings",
          g: r.pricing === "gold" && r.weight != null ? Number(r.weight) : undefined, best: !!r.best, isNew: !!r.is_new, gift: !!r.gift, stock: r.stock,
          names: { en: r.name, ru: r.name_ru, hy: r.name_hy },
          mats: { en: r.mat_en, ru: r.mat_ru, hy: r.mat_hy },
          descs: { en: r.desc_en, ru: r.desc_ru, hy: r.desc_hy }, images: r.images || [],
        };
        const d = discountOf(r);
        if (d > 0) { p.discount = d; p.oldPrice = p.price; p.price = Math.round(p.price * (100 - d)) / 100; }
        setTags(p);
        return p;
      });
      products.splice(0, products.length, ...list);   // тот же массив: на него ссылаются другие скрипты
    }
    applyLang();
    try {
      const gs = await backendGet("gold_settings?select=updated_at&id=eq.1");
      if (gs && gs[0] && gs[0].updated_at) goldDate = new Date(gs[0].updated_at);
      showRateNote();
    } catch (e) {}
  } catch (e) { /* база недоступна — остаётся каталог из кода */ }
})();

// Соцсети в подвале: ссылки берутся из PERLA_SOCIAL в config.js.
(function initSocial() {
  const cfg = window.PERLA_SOCIAL || {};
  const make = {
    instagram: v => v,
    facebook: v => v,
    whatsapp: v => "https://wa.me/" + String(v).replace(/\D/g, ""),
  };
  document.querySelectorAll("#social [data-social]").forEach(a => {
    const v = (cfg[a.dataset.social] || "").trim();
    if (v) a.href = make[a.dataset.social](v);
    else if (!a.getAttribute("href")) a.setAttribute("aria-disabled", "true");
  });
})();

// Глаз рядом с паролем: показать / скрыть.
document.querySelectorAll("#auth .pw .eye").forEach(btn => btn.addEventListener("click", e => {
  e.preventDefault();
  const input = btn.previousElementSibling;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.setAttribute("aria-pressed", show);
  btn.setAttribute("aria-label", t(show ? "pw_hide" : "pw_show"));
  input.focus();
}));

// ---------- карточка товара: фото, описание ----------
const pDlg = document.getElementById("product");
let pCur = null, pIdx = 0;
function renderProduct() {
  const p = pCur; if (!p) return;
  const pics = [p.img, ...(p.images || [])];
  pIdx = (pIdx + pics.length) % pics.length;
  document.getElementById("pdMain").innerHTML = `<img src="${esc(pics[pIdx])}" alt="${esc(pName(p))}">` +
    (pics.length > 1 ? `<button type="button" class="pd-nav prev" data-step="-1" aria-label="${t("slide_prev")}">‹</button><button type="button" class="pd-nav next" data-step="1" aria-label="${t("slide_next")}">›</button>` : "");
  document.getElementById("pdThumbs").innerHTML = pics.length > 1 ? pics.map((src, i) =>
    `<button type="button" data-i="${i}" aria-current="${i === pIdx}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("") : "";
  document.getElementById("pdName").textContent = pName(p);
  document.getElementById("pdMat").textContent = pMat(p);
  document.getElementById("pdPrice").innerHTML = soldOut(p) ? t("sold_out") : priceHtml(p);
  const d = pDesc(p);
  const desc = document.getElementById("pdDesc");
  desc.textContent = d; desc.hidden = !d;
  const add = document.getElementById("pdAdd");
  add.disabled = soldOut(p); add.textContent = soldOut(p) ? t("sold_out") : t("cart_add");
}
function openProduct(name) {
  pCur = byName(name); pIdx = 0;
  if (!pCur || !pDlg) return;
  renderProduct();
  if (!pDlg.open) pDlg.showModal();
}
if (pDlg) {
  pDlg.addEventListener("click", e => {
    if (e.target === pDlg || e.target.closest("#pdClose")) return pDlg.close();
    const st = e.target.closest("[data-step]"); if (st) { pIdx += +st.dataset.step; return renderProduct(); }
    const th = e.target.closest("#pdThumbs [data-i]"); if (th) { pIdx = +th.dataset.i; return renderProduct(); }
    if (e.target.closest("#pdAdd") && pCur && !soldOut(pCur)) {
      addToCart(pCur.name);
      const b = document.getElementById("pdAdd"); b.textContent = t("cart_added");
      setTimeout(() => { if (pDlg.open) renderProduct(); }, 1200);
      cartBtn.classList.remove("bump"); void cartBtn.offsetWidth; cartBtn.classList.add("bump");
    }
  });
  pDlg.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") { pIdx--; renderProduct(); }
    if (e.key === "ArrowRight") { pIdx++; renderProduct(); }
  });
  document.querySelector(".langs") && document.querySelector(".langs").addEventListener("click", () => setTimeout(renderProduct, 0));
}
