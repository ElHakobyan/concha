-- Аккаунты покупателей (Supabase Auth) и их профили.
-- Уже применено к проекту. Запускать повторно безопасно.

-- Профиль: имя, фамилия, телефон, email. Одна строка на каждого пользователя.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'first_name') then
    alter table public.profiles rename column full_name to first_name;
  end if;
end $$;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_lengths;
alter table public.profiles add constraint profiles_lengths check (
  length(coalesce(first_name, '')) <= 100 and length(coalesce(last_name, '')) <= 100 and length(coalesce(phone, '')) <= 30
);
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade;
alter table public.profiles enable row level security;

-- Профиль создаётся сам при регистрации из данных формы.
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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Если пользователь сменит email, он обновится и в профиле.
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

-- Права: каждый видит и правит только свою строку (и только имя, фамилию, телефон).
-- Администратор видит всех.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone) on public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Профили для тех, кто зарегистрировался раньше (например, администратор).
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;
