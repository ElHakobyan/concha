-- Права доступа к таблицам для сайта и админки.
-- В новых проектах Supabase таблицы по умолчанию закрыты для API, поэтому без этих
-- строк сайт не видит товары и тексты из админки, а админка не может их сохранить.
-- Кто именно что видит, всё равно решают правила RLS (только активные товары для всех,
-- изменения только для администратора). Скрипт можно запускать повторно.
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.site_texts to anon, authenticated;
grant insert, update, delete on public.site_texts to authenticated;
grant select on public.gold_settings to anon, authenticated;
grant select, delete on public.subscribers to authenticated;
revoke truncate, trigger, references on public.gold_settings from anon, authenticated;
