// Золотой градиент и украшения как inline SVG (ссылаются на defs в index.html)
const G = "url(#gold)", P = "url(#pearlg)";

const art = {
  ring: `<svg viewBox="0 0 200 200"><ellipse cx="100" cy="112" rx="64" ry="50" fill="${G}"/><ellipse cx="100" cy="108" rx="36" ry="28" fill="#e6d9c8"/><ellipse cx="80" cy="82" rx="26" ry="8" fill="#fff" opacity=".35" transform="rotate(-18 80 82)"/></svg>`,
  pearls: `<svg viewBox="0 0 200 200"><path d="M70 30c-10 10-8 28 6 30M130 30c10 10 8 28-6 30" stroke="${G}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="72" cy="48" r="9" fill="${G}"/><circle cx="128" cy="48" r="9" fill="${G}"/><circle cx="72" cy="105" r="30" fill="${P}"/><circle cx="128" cy="105" r="30" fill="${P}"/></svg>`,
  pendant: `<svg viewBox="0 0 200 200"><path d="M30 10c8 70 40 82 70 82s62-12 70-82" stroke="${G}" stroke-width="3" fill="none"/><path d="M100 90c26 0 38 34 30 64-6 22-60 22-60 0-8-30 4-64 30-64z" fill="#e8e0d2"/><path d="M100 90c26 0 38 34 30 64-6 22-60 22-60 0-8-30 4-64 30-64z" fill="none" stroke="${G}" stroke-width="5"/></svg>`,
  cuff: `<svg viewBox="0 0 200 200"><path d="M40 120c0-50 40-70 90-60 20 4 34 14 38 28" stroke="${G}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M168 88c-10 38-50 60-96 54" stroke="${G}" stroke-width="22" fill="none" stroke-linecap="round" opacity=".92"/></svg>`,
  chain: `<svg viewBox="0 0 200 200"><path d="M40 10c8 70 40 110 60 120 20-10 52-50 60-120" stroke="${G}" stroke-width="2.5" fill="none"/><circle cx="100" cy="132" r="4" fill="${G}"/></svg>`,
  hoops: `<svg viewBox="0 0 200 200"><circle cx="76" cy="105" r="46" fill="none" stroke="${G}" stroke-width="18"/><circle cx="130" cy="120" r="34" fill="none" stroke="${G}" stroke-width="15"/></svg>`,
};

const products = [
  { name: "Aurelia Ring", mat: "Gold Vermeil", price: 98, art: "ring" },
  { name: "Lumin Pearl Drops", mat: "Freshwater Pearls", price: 128, art: "pearls" },
  { name: "Sentinel Pendant", mat: "Gold Vermeil", price: 98, art: "pendant" },
  { name: "Forma Cuff", mat: "Gold Vermeil", price: 148, art: "cuff" },
  { name: "Moment Chain", mat: "14k Gold Fill", price: 68, art: "chain" },
  { name: "Ora Hoops", mat: "Gold Vermeil", price: 108, art: "hoops" },
];

const grid = document.getElementById("products");
grid.innerHTML = products.map(p => `
  <article class="card">
    <div class="img" aria-hidden="true">${art[p.art]}</div>
    <div class="meta">
      <div class="name">${p.name}</div>
      <div class="mat">${p.mat}</div>
      <div class="row"><span>$${p.price.toFixed(2)}</span>
        <button aria-label="Добавить ${p.name}">+</button></div>
    </div>
  </article>`).join("");

const count = document.getElementById("count");
let n = 0;
grid.addEventListener("click", e => {
  if (e.target.closest("button")) count.textContent = ++n;
});

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
  const msg = document.getElementById("msg");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  msg.className = "msg " + (ok ? "ok" : "err");
  msg.textContent = ok ? "Спасибо! Вы подписаны." : "Введите корректный email.";
  if (ok) email.value = "";
});
