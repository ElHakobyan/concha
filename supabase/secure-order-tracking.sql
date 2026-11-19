-- Perla secure order tracking. Run AFTER admin.sql/admin-v2.sql and my-orders.sql.
-- No anonymous order reads. Email ownership is verified by Supabase Auth, not by user input.
begin;
alter table public.orders enable row level security;
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_email_lookup_idx on public.orders (lower(email), id);
create index if not exists orders_user_id_idx on public.orders (user_id);
revoke all on public.orders from anon;
revoke insert, update, delete, truncate, references, trigger on public.orders from authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

-- SECURITY DEFINER checks verified email from auth.users (not mutable user metadata).
create or replace function public.verified_order_email()
returns text language sql stable security definer set search_path = ''
as $$
  select lower(u.email)
  from auth.users u
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null
  limit 1;
$$;
revoke all on function public.verified_order_email() from public, anon;
grant execute on function public.verified_order_email() to authenticated;

-- Do not attach orders for a different checkout email to the signed-in user.
create or replace function public.set_order_user()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.user_id := case when lower(coalesce(new.email,'')) = public.verified_order_email()
                      then (select auth.uid()) else null end;
  return new;
end;
$$;
revoke all on function public.set_order_user() from public, anon, authenticated;
drop trigger if exists orders_set_user on public.orders;
create trigger orders_set_user before insert on public.orders
for each row execute function public.set_order_user();

drop policy if exists orders_select_own on public.orders;
drop policy if exists orders_select_verified_email on public.orders;
create policy orders_select_verified_email on public.orders
for select to authenticated
using (email is not null and lower(email) = (select public.verified_order_email()));

-- Existing admin policy "admin manages orders" remains in force.
do $$ begin
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='admin manages orders') then
  raise exception 'Admin orders policy missing. Run admin.sql first.';
 end if;
 if has_table_privilege('anon','public.orders','SELECT') then raise exception 'Anonymous order read is enabled'; end if;
end $$;
commit;
