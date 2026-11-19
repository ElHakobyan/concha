-- Аккаунты покупателей (Supabase Auth) и их профили.
-- Запускать в SQL Editor целиком. Всё выполняется одной транзакцией:
-- если хоть одна строка упадёт, не применится ничего.
-- Запускать повторно безопасно (ничего не удаляет и не дублирует).
-- Таблицу admins и функцию is_admin() не меняет, кроме снятия лишнего права TRUNCATE (шаг 7).

begin;

-- 1. Колонки профиля. full_name переименовываем в first_name (данные, если есть, сохраняются).
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name') then
    alter table public.profiles rename column full_name to first_name;
  end if;
end $$;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists email text;

-- 2. Ограничение длины, чтобы в профиль нельзя было записать мегабайты текста.
--    NOT VALID: существующие строки не проверяются, только новые и изменённые.
alter table public.profiles drop constraint if exists profiles_lengths;
alter table public.profiles add constraint profiles_lengths check (
  length(coalesce(first_name, '')) <= 100 and length(coalesce(last_name, '')) <= 100 and length(coalesce(phone, '')) <= 30
) not valid;

alter table public.profiles enable row level security;

-- 3. Профиль создаётся сам при регистрации из данных формы.
--    left()/nullif() обрезают и чистят значения, поэтому функция не упадёт и не сорвёт регистрацию.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, email)
  values (
    new.id,
    left(nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''), 100),
    left(nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''), 100),
    left(nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''), 30),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;
-- Триггер on_auth_user_created уже вызывает эту функцию, его не трогаем.

-- 4. Если пользователь сменит email, он обновится и в профиле.
create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Эти функции вызываются только триггерами, напрямую через API их вызвать нельзя.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

-- 5. Права на profiles: гость (anon) ничего; вошедший может читать и менять
--    только имя, фамилию и телефон (не id и не email). Какие строки — решают политики ниже.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- 6. Политики: каждый видит свою строку, администратор видит все. Менять можно только свою.
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 7. Таблица admins: у гостей и вошедших есть право TRUNCATE (очистить таблицу целиком,
--    в обход RLS). Через сайт им не воспользоваться, но держать его незачем. Снимаем.
--    Ваша запись в admins и is_admin() не меняются.
revoke truncate, trigger, references on public.admins from anon, authenticated;

-- 8. Профили для тех, кто зарегистрировался раньше (сейчас это только вы).
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

commit;

-- Проверка после запуска (можно выполнить отдельно):
-- select (select count(*) from auth.users) users, (select count(*) from public.profiles) profiles,
--        (select count(*) from public.admins) admins;
