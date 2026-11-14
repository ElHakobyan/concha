const products = [
  { name: "Aurelia Ring", mat: "Gold Vermeil", price: 98, img: "assets/p1.png" },
  { name: "Lumin Pearl Drops", mat: "Freshwater Pearls", price: 128, img: "assets/p2.png" },
  { name: "Sentinel Pendant", mat: "Gold Vermeil", price: 98, img: "assets/p3.png" },
  { name: "Forma Cuff", mat: "Gold Vermeil", price: 148, img: "assets/p4.png" },
  { name: "Moment Chain", mat: "14k Gold Fill", price: 68, img: "assets/p5.png" },
  { name: "Ora Hoops", mat: "Gold Vermeil", price: 108, img: "assets/p6.png" },
];

const grid = document.getElementById("products");
grid.innerHTML = products.map(p => `
  <article class="card">
    <div class="img"><img src="${p.img}" alt="${p.name}"></div>
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
