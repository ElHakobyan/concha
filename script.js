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

applyLang();
