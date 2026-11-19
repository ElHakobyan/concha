#!/usr/bin/env bash
# Собирает в dist/ только файлы сайта: SQL, скрипты и README в публикацию не попадают.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist
cp -r index.html admin assets ig script.js i18n.js config.js styles.css robots.txt sitemap.xml dist/
echo "Собрано: $(find dist -type f | wc -l) файлов"
