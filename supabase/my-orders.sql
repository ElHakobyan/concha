-- «Мои заказы» для покупателя + исправление смены статуса заказа в админке.
-- Запускать в Supabase → SQL Editor целиком, одним нажатием Run. Повторный запуск безопасен.
--
-- Что делает:
--   1. Добавляет в orders колонку user_id: кто оформил заказ, если покупатель был в аккаунте.
--   2. Триггер сам ставит user_id = вошедший пользователь (или пусто для гостя).
--      С сайта подставить чужой user_id нельзя: значение из запроса всегда перезаписывается.
--   3. Покупатель может ЧИТАТЬ только свои заказы. Вставлять, менять и удалять заказы напрямую он не может.
--   4. Админке разрешено менять у заказа только колонку status (раньше это падало с ошибкой «нет прав»).
--      Кто именно может менять, по-прежнему решает политика «admin manages orders» (только админ).
--
-- Ничего не удаляет: товары, заказы, клиенты остаются. RLS не отключается.
-- Старые заказы остаются с пустым user_id (их видит только админ, как и раньше).

-- 1. Колонка и индекс
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_id_idx on public.orders (user_id);

-- 2. Триггер: user_id берётся только из токена вошедшего пользователя
create or replace function public.set_order_user()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.user_id := auth.uid();   -- null для гостя
  return new;
end;
$$;
revoke all on function public.set_order_user() from public, anon, authenticated;

drop trigger if exists orders_set_user on public.orders;
create trigger orders_set_user
  before insert on public.orders
  for each row execute function public.set_order_user();

-- 3. Права на таблицу. RLS остаётся включённым и решает, какие строки видны.
alter table public.orders enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.orders from anon, authenticated;
grant select on public.orders to authenticated;             -- было и раньше; строки фильтрует RLS
grant update (status) on public.orders to authenticated;    -- только статус; менять может только админ (RLS)

-- 4. Покупатель видит только свои заказы
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id is not null and user_id = (select auth.uid()));

-- 5. Самопроверка: если что-то не так, запуск остановится с понятной ошибкой и ничего не сохранится
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.orders'::regclass) then
    raise exception 'Проверка: RLS на orders выключен';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_own') then
    raise exception 'Проверка: нет политики orders_select_own';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'admin manages orders') then
    raise exception 'Проверка: нет политики admin manages orders';
  end if;
  if has_table_privilege('anon', 'public.orders', 'SELECT') or has_table_privilege('anon', 'public.orders', 'INSERT')
     or has_table_privilege('authenticated', 'public.orders', 'INSERT') or has_table_privilege('authenticated', 'public.orders', 'DELETE') then
    raise exception 'Проверка: лишние права на orders';
  end if;
  if has_column_privilege('authenticated', 'public.orders', 'user_id', 'UPDATE') then
    raise exception 'Проверка: user_id можно менять — так быть не должно';
  end if;
  if (select count(*) from public.admins) < 1 then
    raise exception 'Проверка: таблица admins пуста';
  end if;
end $$;
