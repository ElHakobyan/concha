-- «Мои заказы» для покупателя. ПРЕДЛОЖЕНИЕ — запускать только после подтверждения.
-- Что делает:
--   1. Добавляет в orders колонку user_id (кто оформил заказ, если покупатель был в аккаунте).
--   2. Триггер сам ставит user_id = текущий вошедший пользователь (подделать с сайта нельзя).
--   3. Разрешает покупателю ЧИТАТЬ только свои заказы. Менять/удалять — нельзя.
-- Ничего не удаляет: товары, заказы, клиенты и RLS остаются как есть. Старые заказы получат user_id = null.

alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_id_idx on public.orders (user_id);

create or replace function public.set_order_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := auth.uid();   -- null для гостей
  return new;
end;
$$;
revoke execute on function public.set_order_user() from public, anon, authenticated;

drop trigger if exists orders_set_user on public.orders;
create trigger orders_set_user before insert on public.orders
  for each row execute function public.set_order_user();

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders for select to authenticated
  using (user_id is not null and user_id = (select auth.uid()));

-- Проверка (должно вернуть true, true):
-- select (select relrowsecurity from pg_class where oid = 'public.orders'::regclass) rls_on,
--        exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'orders_select_own') policy_ok;
