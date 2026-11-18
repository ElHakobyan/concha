# Perla

Site vizitka.

Заказы и подписка на рассылку работают через Supabase: инструкция по настройке в [supabase/README.md](supabase/README.md).

Админка (товары, заказы, подписчики, тексты сайта): `ваш-сайт/admin/`. Как включить — шаг 5 в [supabase/README.md](supabase/README.md).

## Выпуск и проверки (CI/CD)

- **Pull request:** GitHub Actions (`ci.yml`) проверяет сайт (синтаксис JS, ссылки на картинки, нет ли секретных ключей) и прогоняет миграции на чистой локальной Supabase вместе с тестом прав (`supabase/tests/permissions.sql`).
- **Сайт:** после слияния в `main` workflow `deploy-site.yml` собирает папку `dist/` (только файлы сайта) и выпускает её на Cloudflare Worker `concha`. Перед выпуском нужно подтверждение в окружении `production`.
- **База:** workflow `deploy-db.yml` запускается только вручную (Actions → Run workflow). Без галочки `apply` он только показывает план миграций.
- **Миграции** лежат в `supabase/migrations/`. Новое изменение базы = новый файл с датой в имени, файлы, которые уже применены, не редактируются. Файлы в `supabase/manual/` содержат ваши личные данные (почта, ключ Resend) и запускаются вручную в SQL Editor.

### Что нужно настроить один раз (Settings → репозиторий)

1. **Environments** → New environment → `production` → включить **Required reviewers** и добавить себя.
2. **Secrets and variables → Actions → Secrets:**
   - `CLOUDFLARE_API_TOKEN`: токен Cloudflare с правом редактировать Workers (шаблон «Edit Cloudflare Workers»).
   - `CLOUDFLARE_ACCOUNT_ID`: ID аккаунта Cloudflare.
   - `SUPABASE_ACCESS_TOKEN`: токен из Supabase → Account → Access Tokens.
   - `SUPABASE_DB_PASSWORD`: пароль базы проекта Concha.

