const products = [
  { name: "Aurelia Ring", mat: "m_vermeil", price: 98, img: "assets/p1.png", cat: "c_rings", best: true },
  { name: "Lumin Pearl Drops", mat: "m_pearls", price: 128, img: "assets/p2.png", cat: "c_earrings", best: true },
  { name: "Sentinel Pendant", mat: "m_vermeil", price: 98, img: "assets/p3.png", cat: "c_necklaces", best: true },
  { name: "Forma Cuff", mat: "m_vermeil", price: 148, img: "assets/p4.png", cat: "c_bracelets", best: true },
  { name: "Moment Chain", mat: "m_fill", price: 68, img: "assets/p5.png", cat: "c_chains", best: true },
  { name: "Ora Hoops", mat: "m_vermeil", price: 108, img: "assets/p6.png", cat: "c_earrings", best: true },
  { name: "Selene Band", mat: "m_gold", price: 68, img: "assets/catalog/rings-1.jpg", cat: "c_rings" },
  { name: "Lyra Leaf Ring", mat: "m_gold", price: 78, img: "assets/catalog/rings-2.jpg", cat: "c_rings" },
  { name: "Thalia Ring", mat: "m_gold", price: 88, img: "assets/catalog/rings-3.jpg", cat: "c_rings" },
  { name: "Iris Filigree Ring", mat: "m_gold", price: 98, img: "assets/catalog/rings-4.jpg", cat: "c_rings" },
  { name: "Daphne Ring", mat: "m_gold", price: 108, img: "assets/catalog/rings-5.jpg", cat: "c_rings" },
  { name: "Aura Signet", mat: "m_gold", price: 118, img: "assets/catalog/rings-6.jpg", cat: "c_rings" },
  { name: "Nyx Hoops", mat: "m_gold", price: 58, img: "assets/catalog/earrings-1.jpg", cat: "c_earrings" },
  { name: "Mira Hoops", mat: "m_gold", price: 68, img: "assets/catalog/earrings-2.jpg", cat: "c_earrings" },
  { name: "Luna Crescents", mat: "m_gold", price: 88, img: "assets/catalog/earrings-3.jpg", cat: "c_earrings" },
  { name: "Ariadne Drops", mat: "m_gold", price: 98, img: "assets/catalog/earrings-4.jpg", cat: "c_earrings" },
  { name: "Eros Hoops", mat: "m_gold", price: 118, img: "assets/catalog/earrings-5.jpg", cat: "c_earrings" },
  { name: "Taurus Studs", mat: "m_gold", price: 108, img: "assets/catalog/earrings-6.jpg", cat: "c_earrings" },
  { name: "Aria Thread", mat: "m_gold", price: 88, img: "assets/catalog/necklaces-1.jpg", cat: "c_necklaces" },
  { name: "Calypso Chain", mat: "m_gold", price: 98, img: "assets/catalog/necklaces-2.jpg", cat: "c_necklaces" },
  { name: "Hestia Collar", mat: "m_gold", price: 128, img: "assets/catalog/necklaces-3.jpg", cat: "c_necklaces" },
  { name: "Dione Fringe", mat: "m_gold", price: 138, img: "assets/catalog/necklaces-4.jpg", cat: "c_necklaces" },
  { name: "Rhea Beads", mat: "m_gold", price: 108, img: "assets/catalog/necklaces-5.jpg", cat: "c_necklaces" },
  { name: "Phoebe Pendants", mat: "m_gold", price: 148, img: "assets/catalog/necklaces-6.jpg", cat: "c_necklaces" },
  { name: "Echo Serpent", mat: "m_gold", price: 128, img: "assets/catalog/bracelets-1.jpg", cat: "c_bracelets" },
  { name: "Gaia Cuff", mat: "m_gold", price: 118, img: "assets/catalog/bracelets-2.jpg", cat: "c_bracelets" },
  { name: "Twin Bangles", mat: "m_gold", price: 98, img: "assets/catalog/bracelets-3.jpg", cat: "c_bracelets" },
  { name: "Carnelian Twist", mat: "m_gold", price: 158, img: "assets/catalog/bracelets-4.jpg", cat: "c_bracelets" },
  { name: "Ember Bands", mat: "m_gold", price: 88, img: "assets/catalog/bracelets-5.jpg", cat: "c_bracelets" },
  { name: "Thread Band", mat: "m_gold", price: 68, img: "assets/catalog/bracelets-6.jpg", cat: "c_bracelets" },
  { name: "Wisp Chain", mat: "m_gold", price: 58, img: "assets/catalog/chains-1.jpg", cat: "c_chains" },
  { name: "Silk Chain", mat: "m_gold", price: 68, img: "assets/catalog/chains-2.jpg", cat: "c_chains" },
  { name: "Amber Drop Chain", mat: "m_gold", price: 98, img: "assets/catalog/chains-3.jpg", cat: "c_chains" },
  { name: "Pendant Chain", mat: "m_gold", price: 88, img: "assets/catalog/chains-4.jpg", cat: "c_chains" },
  { name: "Clasp Chain", mat: "m_gold", price: 78, img: "assets/catalog/chains-5.jpg", cat: "c_chains" },
  { name: "Trio Chain", mat: "m_gold", price: 98, img: "assets/catalog/chains-6.jpg", cat: "c_chains" },
];

const LANGS = ["hy", "ru", "en"];
let lang = "ru";
try {
  const saved = localStorage.getItem("lang");
  if (LANGS.includes(saved)) lang = saved;
} catch (e) {}

const t = key => I18N[lang][key] ?? I18N.ru[key] ?? key;
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Название и материал товара на текущем языке (из админки), иначе — как в коде.
const pName = p => (p.names && p.names[lang]) || p.name;
const pMat = p => (p.mats && p.mats[lang]) || t(p.mat);
const soldOut = p => p.stock === 0;

const grid = document.getElementById("products");
const count = document.getElementById("count");
const msg = document.getElementById("msg");
let msgKey = null;

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
      <div class="img"><img src="${esc(p.img)}" alt="${esc(pName(p))}">${soldOut(p) ? `<span class="soldout">${t("sold_out")}</span>` : ""}</div>
      <div class="meta">
        <div class="name">${esc(pName(p))}</div>
        <div class="mat">${esc(pMat(p))}</div>
        <div class="row"><span>$${p.price.toFixed(2)}</span>
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
  document.querySelector('meta[name="description"]').content = t("meta_desc");
  document.querySelectorAll(".langs button").forEach(b => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
  if (msgKey) msg.textContent = t(msgKey);
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

document.querySelector(".langs").addEventListener("click", e => {
  const b = e.target.closest("button[data-lang]");
  if (!b) return;
  lang = b.dataset.lang;
  try { localStorage.setItem("lang", lang); } catch (err) {}
  applyLang();
});

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
  count.textContent = qty;
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
  if (!b || b.disabled) return;
  addToCart(b.dataset.name);
  b.classList.add("added"); b.textContent = "✓"; b.setAttribute("title", t("cart_added"));
  setTimeout(() => { b.classList.remove("added"); b.textContent = "+"; b.removeAttribute("title"); }, 1200);
  cartBtn.classList.remove("bump"); void cartBtn.offsetWidth; cartBtn.classList.add("bump");
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
  const cfg = window.CONCHA_BACKEND || {};
  const fail = code => Object.assign(new Error(code), { code });
  if (!cfg.url || !cfg.anonKey) throw fail("not_configured");
  let res;
  try {
    res = await fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { apikey: cfg.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
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
  if (order.p_email && !isEmail(order.p_email)) return setCartMsg("order_err_email", false);

  sendingOrder = true; setCartMsg("order_sending"); renderCart();
  try {
    const id = await backend("place_order", order);
    cart = {}; saveCart(); orderForm.reset(); orderFields.hidden = true;
    setCartMsg("cart_done", true, { id });
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

function setSubMsg(key, ok) {
  msgKey = key;
  msg.className = "msg " + (ok ? "ok" : "err");
  msg.textContent = t(key);
}
document.getElementById("form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email");
  const btn = e.target.querySelector("button[type=submit]");
  const value = email.value.trim().toLowerCase();
  if (!isEmail(value)) return setSubMsg("sub_err", false);
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    await backend("subscribe", { p_email: value, p_lang: lang });
    email.value = "";
    setSubMsg("sub_ok", true);
  } catch (err) {
    setSubMsg(err.code === "bad_email" ? "sub_err" : "sub_err_net", false);
  } finally {
    btn.disabled = false;
  }
});

// ---------- регистрация / вход (демо: данные только в localStorage) ----------
const authDlg = document.getElementById("auth");
const authForm = document.getElementById("authForm");
const authMsg = document.getElementById("authMsg");
const userBtn = document.getElementById("userBtn");
let authMode = "register";

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
async function hashPw(pw, salt) {
  if (!(window.crypto && crypto.subtle)) throw new Error("no-crypto");
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pw)));
}
const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));
const currentUser = () => { const e = load("session", null); const u = e && load("users", {})[e]; return u ? { email: e, ...u } : null; };

function renderAuth() {
  const user = currentUser();
  const reg = authMode === "register";
  authForm.hidden = !!user;
  document.getElementById("account").hidden = !user;
  document.getElementById("authTitle").textContent = user ? t("auth_account") : t(reg ? "auth_register" : "auth_login");
  authForm.querySelectorAll("[data-reg]").forEach(el => { el.hidden = !reg; });
  authForm.querySelectorAll(".tabs button").forEach(b => {
    const on = b.dataset.mode === authMode;
    b.classList.toggle("on", on); b.setAttribute("aria-selected", on);
  });
  document.getElementById("authSubmit").textContent = t(reg ? "auth_sub_reg" : "auth_sub_login");
  document.getElementById("aPass").autocomplete = reg ? "new-password" : "current-password";
  if (user) document.getElementById("hello").textContent = t("auth_hello").replace("{name}", `${user.name} ${user.surname || ""}`.trim());
  const av = document.getElementById("avatar");
  av.textContent = user ? user.name.trim().charAt(0).toUpperCase() : "";
  userBtn.classList.toggle("in", !!user);
  if (authMsgKey) authMsg.textContent = t(authMsgKey);
}

let authMsgKey = null;
function setAuthMsg(key, ok) { authMsgKey = key || null; authMsg.className = "msg " + (ok ? "ok" : "err"); authMsg.textContent = key ? t(key) : ""; }

function openAuth() {
  setAuthMsg("");
  renderAuth();
  if (!authDlg.open) authDlg.showModal();
  const first = currentUser() ? document.getElementById("logout") : (authMode === "register" ? "aName" : "aEmail");
  (typeof first === "string" ? document.getElementById(first) : first).focus();
}

userBtn.addEventListener("click", openAuth);
document.getElementById("authClose").addEventListener("click", () => authDlg.close());
authDlg.addEventListener("click", e => { if (e.target === authDlg) authDlg.close(); });
authForm.querySelector(".tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-mode]");
  if (!b) return;
  authMode = b.dataset.mode; setAuthMsg(""); renderAuth();
});
document.getElementById("logout").addEventListener("click", () => {
  try { localStorage.removeItem("session"); } catch (e) {}
  authMode = "login"; renderAuth(); authDlg.close();
});

authForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("aName").value.trim();
  const surname = document.getElementById("aSurname").value.trim();
  const phone = document.getElementById("aPhone").value.trim();
  const email = document.getElementById("aEmail").value.trim().toLowerCase();
  const pw = document.getElementById("aPass").value;
  const pw2 = document.getElementById("aPass2").value;
  const reg = authMode === "register";
  if (reg && !name) return setAuthMsg("auth_err_name");
  if (reg && !surname) return setAuthMsg("auth_err_surname");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthMsg("auth_err_email");
  if (reg && !/^\+?\d{7,15}$/.test(phone.replace(/[\s\-()]/g, ""))) return setAuthMsg("auth_err_phone");
  if (reg && pw.length < 8) return setAuthMsg("auth_err_pass");
  if (reg && pw !== pw2) return setAuthMsg("auth_err_match");
  const users = load("users", {});
  try {
    if (reg) {
      if (users[email]) return setAuthMsg("auth_err_exists");
      const salt = newSalt();
      users[email] = { name, surname, phone, salt, hash: await hashPw(pw, salt) };
      save("users", users);
    } else {
      const u = users[email];
      if (!u || (await hashPw(pw, u.salt)) !== u.hash) return setAuthMsg("auth_err_login");
    }
  } catch (err) { return setAuthMsg("auth_err_crypto"); }
  save("session", email);
  authForm.reset();
  renderAuth();
  setAuthMsg("");
});

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
  { src: "assets/hero.png", size: "auto 100%" },
  { src: "assets/hero2.jpg", size: "cover" },
  { src: "assets/hero3.jpg", size: "cover" },
  // Ещё кадры: положите файл в assets/ и раскомментируйте строку.
  // { src: "assets/hero4.jpg", size: "cover" },
  // { src: "assets/hero5.jpg", size: "cover" },
];
(async function initHeroSlides() {
  const box = document.getElementById("heroSlides");
  const ctrl = document.getElementById("heroCtrl");
  const dotsEl = document.getElementById("heroDots");
  const hero = document.getElementById("hero");
  const loaded = (await Promise.all(HERO_SLIDES.map(s => new Promise(res => {
    const img = new Image();
    img.onload = () => res(s); img.onerror = () => res(null);
    img.src = s.src;
  })))).filter(Boolean);
  if (!loaded.length) return;
  box.innerHTML = loaded.map(s => `<div class="slide" style="background-image:url('${s.src}');background-size:${s.size}"></div>`).join("");
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
        <img src="${esc(p.img)}" alt="${esc(pName(p))}" loading="lazy">
        <div class="dd-info"><div class="dd-name">${esc(pName(p))}</div><div class="dd-mat">${esc(pMat(p))}</div><div class="dd-price">${soldOut(p) ? t("sold_out") : money(p.price)}</div></div>
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
const DB_CATS = { rings: "c_rings", earrings: "c_earrings", necklaces: "c_necklaces", bracelets: "c_bracelets", chains: "c_chains" };
async function backendGet(path) {
  const cfg = window.CONCHA_BACKEND || {};
  if (!cfg.url || !cfg.anonKey) return null;
  const res = await fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/" + path, { headers: { apikey: cfg.anonKey } });
  if (!res.ok) throw new Error("http_" + res.status);
  return res.json();
}
(async function loadFromBackend() {
  try {
    const [rows, texts] = await Promise.all([
      backendGet("products?select=*&active=is.true&order=sort.asc,name.asc"),
      backendGet("site_texts?select=key,ru,en,hy").catch(() => []),
    ]);
    if (!rows) return;
    (texts || []).forEach(r => LANGS.forEach(l => { if (r[l]) I18N[l][r.key] = r[l]; }));
    // Пока admin.sql не запущен, у товаров нет фото — оставляем каталог из кода.
    if (rows.length && rows.every(r => r.img)) {
      const list = rows.map(r => {
        const p = {
          name: r.name, price: Number(r.price), img: r.img, cat: DB_CATS[r.category] || "c_rings",
          best: !!r.best, isNew: !!r.is_new, gift: !!r.gift, stock: r.stock,
          names: { en: r.name, ru: r.name_ru, hy: r.name_hy },
          mats: { en: r.mat_en, ru: r.mat_ru, hy: r.mat_hy },
        };
        setTags(p);
        return p;
      });
      products.splice(0, products.length, ...list);   // тот же массив: на него ссылаются другие скрипты
    }
    applyLang();
  } catch (e) { /* база недоступна — остаётся каталог из кода */ }
})();
