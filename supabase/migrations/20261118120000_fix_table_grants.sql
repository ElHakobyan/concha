-- Исправление прав на таблицы.
-- Проблема: у ролей anon и authenticated не было SELECT/INSERT/UPDATE/DELETE,
-- поэтому политики RLS не срабатывали, сайт получал 401 (permission denied),
-- а админка не могла сохранять изменения.
-- Что делает файл: выдаёт только нужные права (строки дальше фильтрует RLS)
-- и убирает лишние. Можно запускать повторно.

-- Посетители сайта: только чтение того, что нужно витрине.
grant select on public.products, public.site_texts, public.gold_settings to anon;

-- Вошедшие пользователи: права на таблицы; кого пускать, решают политики is_admin().
grant select, insert, update, delete
  on public.products, public.site_texts, public.orders, public.subscribers to authenticated;
grant select on public.gold_settings, public.admins to authenticated;

-- Лишние права, которые RLS не ограничивает.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
