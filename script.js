const products = [
  { name: "Aurelia Ring", mat: "m_vermeil", price: 98, img: "assets/p1.png", cat: "c_rings" },
  { name: "Lumin Pearl Drops", mat: "m_pearls", price: 128, img: "assets/p2.png", cat: "c_earrings" },
  { name: "Sentinel Pendant", mat: "m_vermeil", price: 98, img: "assets/p3.png", cat: "c_necklaces" },
  { name: "Forma Cuff", mat: "m_vermeil", price: 148, img: "assets/p4.png", cat: "c_bracelets" },
  { name: "Moment Chain", mat: "m_fill", price: 68, img: "assets/p5.png", cat: "c_chains" },
  { name: "Ora Hoops", mat: "m_vermeil", price: 108, img: "assets/p6.png", cat: "c_earrings" },
];

const LANGS = ["hy", "ru", "en"];
let lang = "ru";
try {
  const saved = localStorage.getItem("lang");
  if (LANGS.includes(saved)) lang = saved;
} catch (e) {}

const t = key => I18N[lang][key] ?? I18N.ru[key] ?? key;

const grid = document.getElementById("products");
const count = document.getElementById("count");
const msg = document.getElementById("msg");
let msgKey = null;

let query = "";
const noResults = document.getElementById("noresults");

function renderProducts() {
  const q = query.trim().toLowerCase();
  // ищем сразу по всем языкам (hy/ru/en)
  const hay = p => `${p.name} ${LANGS.map(l => `${I18N[l][p.mat]} ${I18N[l][p.cat]}`).join(" ")}`.toLowerCase();
  const list = products.filter(p => !q || hay(p).includes(q));
  noResults.hidden = list.length > 0;
  grid.innerHTML = list.map(p => `
    <article class="card">
      <div class="img"><img src="${p.img}" alt="${p.name}"></div>
      <div class="meta">
        <div class="name">${p.name}</div>
        <div class="mat">${t(p.mat)}</div>
        <div class="row"><span>$${p.price.toFixed(2)}</span>
          <button class="add" data-name="${p.name}" aria-label="${t("cart_add")}: ${p.name}">+</button></div>
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

function saveCart() { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {} }

function renderCart() {
  const names = Object.keys(cart).filter(k => byName(k) && cart[k] > 0);
  const qty = names.reduce((s, k) => s + cart[k], 0);
  const total = names.reduce((s, k) => s + cart[k] * byName(k).price, 0);
  count.textContent = qty;
  document.getElementById("cartTotal").textContent = money(total);
  document.getElementById("checkout").disabled = qty === 0;
  cartItems.innerHTML = names.length ? names.map(k => {
    const p = byName(k);
    return `<div class="cart-item">
      <img src="${p.img}" alt="">
      <div class="ci-info"><div class="ci-name">${p.name}</div><div class="ci-mat">${t(p.mat)}</div>
        <div class="ci-qty"><button type="button" data-act="dec" data-name="${p.name}" aria-label="-">−</button><span>${cart[k]}</span><button type="button" data-act="inc" data-name="${p.name}" aria-label="+">+</button></div></div>
      <div class="ci-side"><b>${money(cart[k] * p.price)}</b><button type="button" class="ci-rm" data-act="rm" data-name="${p.name}">${t("cart_remove")}</button></div>
    </div>`;
  }).join("") : `<p class="cart-empty">${t("cart_empty")}</p>`;
}

function openCart(open) {
  cartEl.classList.toggle("open", open);
  cartEl.setAttribute("aria-hidden", !open);
  overlay.hidden = !open;
  cartBtn.setAttribute("aria-expanded", open);
  if (open) { cartMsg.textContent = ""; document.getElementById("cartClose").focus(); }
}

function addToCart(name) {
  cart[name] = (cart[name] || 0) + 1;
  saveCart(); renderCart();
}

grid.addEventListener("click", e => {
  const b = e.target.closest("button.add");
  if (!b) return;
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
  if (b.dataset.act === "inc") cart[k]++;
  if (b.dataset.act === "dec") cart[k]--;
  if (b.dataset.act === "rm" || cart[k] <= 0) delete cart[k];
  saveCart(); renderCart();
});
document.getElementById("checkout").addEventListener("click", () => {
  cart = {}; saveCart(); renderCart();
  cartMsg.textContent = t("cart_done");
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && cartEl.classList.contains("open")) { openCart(false); cartBtn.focus(); } });

const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", false); });

document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("email");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  msgKey = ok ? "sub_ok" : "sub_err";
  msg.className = "msg " + (ok ? "ok" : "err");
  msg.textContent = t(msgKey);
  if (ok) email.value = "";
});

applyLang();
