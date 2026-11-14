const products = [
  { name: "Aurelia Ring", mat: "Gold Vermeil", price: 98, icon: "◯" },
  { name: "Lumin Pearl Drops", mat: "Freshwater Pearls", price: 128, icon: "⚭" },
  { name: "Sentinel Pendant", mat: "Gold Vermeil", price: 98, icon: "⌵" },
  { name: "Forma Cuff", mat: "Gold Vermeil", price: 148, icon: "○" },
  { name: "Moment Chain", mat: "14k Gold Fill", price: 68, icon: "◡" },
  { name: "Ora Hoops", mat: "Gold Vermeil", price: 108, icon: "✦" },
];

const grid = document.getElementById("products");
grid.innerHTML = products.map(p => `
  <article class="card">
    <div class="img" aria-hidden="true">${p.icon}</div>
    <div class="meta">
      <div class="name">${p.name}</div>
      <div class="mat">${p.mat}</div>
      <div class="row"><span>$${p.price.toFixed(2)}</span>
        <button aria-label="Связаться по поводу ${p.name}" data-name="${p.name}">+</button></div>
    </div>
  </article>`).join("");

grid.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (b) location.hash = "contact";
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
