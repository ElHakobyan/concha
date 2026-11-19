-- Аккаунты покупателей (Supabase Auth) и их профили.
-- Запускать в SQL Editor целиком. Всё выполняется одной транзакцией:
-- если хоть одна проверка или команда не пройдёт, не применится ничего.
-- Запускать повторно безопасно: ничего не удаляет из данных и не дублирует.
-- Таблицу admins (её строки) и функцию is_admin() не меняет.

begin;

-- 1. Колонки профиля. full_name переименовываем в first_name (данные, если есть, сохраняются).
--    Сайт и админка full_name не используют, только first_name / last_name.
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

-- 3. Функция, которая создаёт профиль при регистрации.
--    left()/nullif() обрезают и чистят значения, поэтому вставка не упадёт и не сорвёт регистрацию.
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

-- 4. Триггер регистрации: пересоздаём, чтобы он точно был, был включён
--    и вызывал именно эту функцию после каждой новой записи в auth.users.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Если пользователь сменит email, он обновится и в профиле.
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

-- 6. Права на profiles, минимально необходимые:
--    гость (anon) — ничего;
--    вошедший (authenticated) — читать только перечисленные колонки
--      (новые колонки в будущем не откроются сами), менять только имя, фамилию и телефон.
--    Какие именно строки — решают политики в шаге 7.
revoke all on public.profiles from anon, authenticated;
grant select (id, first_name, last_name, phone, email, created_at) on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

-- 7. Политики RLS. Удаляем ВСЕ существующие политики на profiles (какие бы ни были,
--    например profiles_admin_read), и создаём ровно две. Так ни одна старая политика
--    не расширит доступ незаметно.
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy %I on public.profiles', r.policyname);
  end loop;
end $$;
-- Читать: свою строку; администратор — все.
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));
-- Менять: только свою строку (даже администратор чужие профили не правит).
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- Политик на INSERT и DELETE нет: профиль создаёт только триггер, удаляется вместе с пользователем.

-- 8. Таблица admins: у гостей и вошедших есть право TRUNCATE (очистить таблицу целиком,
--    в обход RLS). Через сайт им не воспользоваться, но держать его незачем. Снимаем.
revoke truncate, trigger, references on public.admins from anon, authenticated;

-- 9. Профили для тех, кто зарегистрировался раньше (сейчас это только вы).
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 10. Проверки. Если что-то не так, транзакция откатится и ничего не изменится.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created'
      and tgfoid = 'public.handle_new_user'::regproc and tgenabled <> 'D'
  ) then raise exception 'Проверка: триггер on_auth_user_created не создан'; end if;

  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'profiles') <> 2 then
    raise exception 'Проверка: на profiles должно быть ровно 2 политики';
  end if;

  if exists (select 1 from information_schema.role_table_grants
             where table_schema = 'public' and table_name = 'profiles' and grantee in ('anon', 'PUBLIC')) then
    raise exception 'Проверка: у anon остались права на profiles';
  end if;

  if exists (select 1 from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)) then
    raise exception 'Проверка: не у всех пользователей есть профиль';
  end if;

  if (select count(*) from public.admins) < 1 then
    raise exception 'Проверка: таблица admins пуста';
  end if;
end $$;

commit;

-- После запуска можно выполнить отдельно, чтобы посмотреть результат:
-- select (select count(*) from auth.users) users, (select count(*) from public.profiles) profiles,
--        (select count(*) from public.admins) admins;
