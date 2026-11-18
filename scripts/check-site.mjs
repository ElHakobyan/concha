// Проверки сайта: синтаксис JS, ссылки на файлы, отсутствие секретов.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";

let failed = false;
const fail = msg => { console.error("FAIL:", msg); failed = true; };

// 1. Синтаксис JS
for (const f of ["script.js", "i18n.js", "config.js", "admin/admin.js"]) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { fail(`синтаксическая ошибка в ${f}\n${e.stderr}`); }
}

// 2. Локальные ссылки в HTML
const refRe = /(?:src|href)=["']([^"'#?]+)(?:[?#][^"']*)?["']/g;
for (const page of ["index.html", "admin/index.html"]) {
  const html = readFileSync(page, "utf8");
  for (const m of html.matchAll(refRe)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
    const path = ref.startsWith("/") ? ref.slice(1) : join(dirname(page), ref);
    if (!existsSync(path)) fail(`${page}: нет файла ${ref}`);
  }
}

// 3. Картинки, которые перечислены в каталоге script.js
const js = readFileSync("script.js", "utf8");
for (const m of js.matchAll(/img:\s*"([^"]+)"/g)) {
  if (!existsSync(m[1])) fail(`script.js: нет картинки ${m[1]}`);
}

// 4. В файлах сайта не должно быть секретных ключей
const secretRe = /service_role|sb_secret_|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;
const walk = d => readdirSync(d).flatMap(n => {
  if ([".git", "node_modules", "dist", "supabase", "scripts", ".github"].includes(n)) return [];
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const p of walk(".")) {
  if (!/\.(html|js|css|json|toml|txt|xml)$/.test(p)) continue;
  if (secretRe.test(readFileSync(p, "utf8"))) fail(`похоже на секретный ключ в ${p}`);
}

if (failed) process.exit(1);
console.log("Проверки сайта пройдены");
