-- Perla: админ-панель (страница /admin на сайте).
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.
-- Запускать ПОСЛЕ schema.sql. Перед запуском замените ВСТАВЬТЕ_ВАШУ_ПОЧТУ в самом
-- конце файла на почту, с которой вы будете входить в админку (см. supabase/README.md).
-- Файл можно запускать повторно: он ничего не удаляет и не дублирует.

-- ---------- Кто администратор ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Товары: всё, что нужно для каталога ----------
-- name — главное название (английское), по нему же сервер находит цену в заказе.
alter table public.products
  add column if not exists name_ru   text,            -- пусто = как name
  add column if not exists name_hy   text,
  add column if not exists mat_en    text,            -- материал на трёх языках
  add column if not exists mat_ru    text,
  add column if not exists mat_hy    text,
  add column if not exists img       text,            -- ссылка на фото
  add column if not exists stock     int check (stock is null or stock >= 0), -- пусто = не считать остаток
  add column if not exists best      boolean not null default false,  -- показывать в «Хитах» на главной
  add column if not exists is_new    boolean not null default false,  -- категория «Новинки»
  add column if not exists gift      boolean not null default false,  -- категория «Подарки»
  add column if not exists sort      int not null default 1000,       -- порядок на сайте (меньше = выше)
  add column if not exists updated_at timestamptz not null default now();

-- Перенос текущего каталога из script.js (только для товаров, у которых ещё нет фото).
update public.products p set
  img = v.img, sort = v.sort, best = v.best, is_new = v.is_new, gift = v.gift,
  mat_en = v.mat_en, mat_ru = v.mat_ru, mat_hy = v.mat_hy
from (values
  ('Aurelia Ring', 'assets/p1.png', 10, true, false, false, 'Gold Vermeil', 'Золотой вермейль', 'Ոսկեպատ արծաթ'),
  ('Lumin Pearl Drops', 'assets/p2.png', 20, true, true, true, 'Freshwater Pearls', 'Пресноводный жемчуг', 'Քաղցրահամ ջրերի մարգարիտ'),
  ('Sentinel Pendant', 'assets/p3.png', 30, true, false, true, 'Gold Vermeil', 'Золотой вермейль', 'Ոսկեպատ արծաթ'),
  ('Forma Cuff', 'assets/p4.png', 40, true, false, false, 'Gold Vermeil', 'Золотой вермейль', 'Ոսկեպատ արծաթ'),
  ('Moment Chain', 'assets/p5.png', 50, true, true, true, '14k Gold Fill', 'Золото 14k Gold Fill', '14k Gold Fill ոսկի'),
  ('Ora Hoops', 'assets/p6.png', 60, true, true, false, 'Gold Vermeil', 'Золотой вермейль', 'Ոսկեպատ արծաթ'),
  ('Selene Band', 'assets/catalog/rings-1.jpg', 70, false, true, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Lyra Leaf Ring', 'assets/catalog/rings-2.jpg', 80, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Thalia Ring', 'assets/catalog/rings-3.jpg', 90, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Iris Filigree Ring', 'assets/catalog/rings-4.jpg', 100, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Daphne Ring', 'assets/catalog/rings-5.jpg', 110, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Aura Signet', 'assets/catalog/rings-6.jpg', 120, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Nyx Hoops', 'assets/catalog/earrings-1.jpg', 130, false, false, true, 'Gold', 'Золото', 'Ոսկի'),
  ('Mira Hoops', 'assets/catalog/earrings-2.jpg', 140, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Luna Crescents', 'assets/catalog/earrings-3.jpg', 150, false, true, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Ariadne Drops', 'assets/catalog/earrings-4.jpg', 160, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Eros Hoops', 'assets/catalog/earrings-5.jpg', 170, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Taurus Studs', 'assets/catalog/earrings-6.jpg', 180, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Aria Thread', 'assets/catalog/necklaces-1.jpg', 190, false, false, true, 'Gold', 'Золото', 'Ոսկի'),
  ('Calypso Chain', 'assets/catalog/necklaces-2.jpg', 200, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Hestia Collar', 'assets/catalog/necklaces-3.jpg', 210, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Dione Fringe', 'assets/catalog/necklaces-4.jpg', 220, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Rhea Beads', 'assets/catalog/necklaces-5.jpg', 230, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Phoebe Pendants', 'assets/catalog/necklaces-6.jpg', 240, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Echo Serpent', 'assets/catalog/bracelets-1.jpg', 250, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Gaia Cuff', 'assets/catalog/bracelets-2.jpg', 260, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Twin Bangles', 'assets/catalog/bracelets-3.jpg', 270, false, false, true, 'Gold', 'Золото', 'Ոսկի'),
  ('Carnelian Twist', 'assets/catalog/bracelets-4.jpg', 280, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Ember Bands', 'assets/catalog/bracelets-5.jpg', 290, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Thread Band', 'assets/catalog/bracelets-6.jpg', 300, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Wisp Chain', 'assets/catalog/chains-1.jpg', 310, false, true, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Silk Chain', 'assets/catalog/chains-2.jpg', 320, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Amber Drop Chain', 'assets/catalog/chains-3.jpg', 330, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Pendant Chain', 'assets/catalog/chains-4.jpg', 340, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Clasp Chain', 'assets/catalog/chains-5.jpg', 350, false, false, false, 'Gold', 'Золото', 'Ոսկի'),
  ('Trio Chain', 'assets/catalog/chains-6.jpg', 360, false, false, false, 'Gold', 'Золото', 'Ոսկի')
) as v(name, img, sort, best, is_new, gift, mat_en, mat_ru, mat_hy)
where p.name = v.name and p.img is null;

-- ---------- Тексты сайта ----------
-- Здесь хранятся только тексты, изменённые в админке. Остальные берутся из i18n.js.
create table if not exists public.site_texts (
  key        text primary key,
  ru         text,
  en         text,
  hy         text,
  updated_at timestamptz not null default now()
);
alter table public.site_texts enable row level security;

-- ---------- Права доступа ----------
-- Посетители сайта: видят только включённые товары и тексты.
-- Администратор: видит и меняет всё.
drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated using (active or public.is_admin());
-- Если уже запущен admin-v2.sql, архивные товары по-прежнему скрыты от посетителей.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'products' and column_name = 'archived') then
    execute 'alter policy "public reads active products" on public.products using ((active and not archived) or public.is_admin())';
  end if;
end $$;
drop policy if exists "admin manages products" on public.products;
create policy "admin manages products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads texts" on public.site_texts;
create policy "public reads texts" on public.site_texts
  for select to anon, authenticated using (true);
drop policy if exists "admin manages texts" on public.site_texts;
create policy "admin manages texts" on public.site_texts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages orders" on public.orders;
create policy "admin manages orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages subscribers" on public.subscribers;
create policy "admin manages subscribers" on public.subscribers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin sees admins" on public.admins;
create policy "admin sees admins" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------- Фото товаров ----------
-- Публичная папка: фото видны всем, загружать и удалять может только администратор.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "admin uploads product images" on storage.objects;
create policy "admin uploads product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin updates product images" on storage.objects;
create policy "admin updates product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin deletes product images" on storage.objects;
create policy "admin deletes product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- ---------- Заказ: теперь с проверкой остатка ----------
-- То же, что в schema.sql, плюс: если у товара указан остаток, заказать больше нельзя,
-- а после заказа остаток уменьшается.
-- Если уже запущен admin-v2.sql, его версия функции новее (скидки, архив): повторный запуск этого файла её не откатит.
do $guard$
begin
  if exists (select 1 from pg_proc where proname = 'place_order' and pronamespace = 'public'::regnamespace
             and prosrc like '%product_discount%') then
    raise notice 'place_order: оставляю более новую версию';
    return;
  end if;
  execute $fn$
create or replace function public.place_order(
  p_name text, p_phone text, p_items jsonb,
  p_email text default null, p_address text default null,
  p_comment text default null, p_lang text default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $body$
declare
  v_items jsonb := '[]'::jsonb;
  v_total numeric(10,2) := 0;
  v_item  jsonb;
  v_qty   int;
  v_price numeric(10,2);
  v_stock int;
  v_found boolean;
  v_id    bigint;
begin
  p_name    := nullif(btrim(p_name), '');
  p_phone   := nullif(btrim(p_phone), '');
  p_email   := nullif(lower(btrim(p_email)), '');
  p_address := nullif(btrim(p_address), '');
  p_comment := nullif(btrim(p_comment), '');

  if p_name is null or length(p_name) > 100 then raise exception 'bad_name'; end if;
  if p_phone is null or regexp_replace(p_phone, '[\s\-()]', '', 'g') !~ '^\+?\d{7,15}$' then
    raise exception 'bad_phone';
  end if;
  if p_email is null or length(p_email) > 254 or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+
  end if;
  if length(coalesce(p_address, '')) > 300 or length(coalesce(p_comment, '')) > 1000 then
    raise exception 'too_long';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'bad_items';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'bad_qty'; end if;
    select price, stock, true into v_price, v_stock, v_found
      from products where name = v_item->>'name' and active
      for update;                                   -- чтобы два заказа не купили последнюю штуку
    if v_found is null then raise exception 'unknown_product'; end if;
    if v_stock is not null then
      if v_stock < v_qty then raise exception 'out_of_stock'; end if;
      update products set stock = stock - v_qty where name = v_item->>'name';
    end if;
    v_items := v_items || jsonb_build_object('name', v_item->>'name', 'qty', v_qty, 'price', v_price);
    v_total := v_total + v_price * v_qty;
    v_found := null;
  end loop;

  insert into orders (customer_name, phone, email, address, comment, lang, items, total)
  values (p_name, p_phone, p_email, p_address, p_comment, left(p_lang, 5), v_items, v_total)
  returning id into v_id;
  return v_id;
end;
$body$;
  $fn$;
end $guard$;
revoke all on function public.place_order(text, text, jsonb, text, text, text, text) from public;
grant execute on function public.place_order(text, text, jsonb, text, text, text, text) to anon, authenticated;

-- Отменили заказ в админке — товары возвращаются на склад (и наоборот).
create or replace function public.restock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sign int;
  i jsonb;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'cancelled' then v_sign := 1;
  elsif old.status = 'cancelled' then v_sign := -1;
  else return new; end if;
  for i in select * from jsonb_array_elements(new.items) loop
    update products set stock = greatest(stock + v_sign * (i->>'qty')::int, 0)
      where name = i->>'name' and stock is not null;
  end loop;
  return new;
end;
$$;
revoke all on function public.restock_on_cancel() from public, anon, authenticated;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock
  after update of status on public.orders
  for each row execute function public.restock_on_cancel();

-- ---------- Ваш доступ ----------
-- Сначала создайте себе пользователя: Authentication → Users → Add user → Create new user
-- (почта + пароль, галочка Auto Confirm User). Потом впишите эту почту ниже и запустите файл.
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('ВСТАВЬТЕ_ВАШУ_ПОЧТУ')
on conflict do nothing;
 then
    raise exception 'bad_email';
  end if;
  if length(coalesce(p_address, '')) > 300 or length(coalesce(p_comment, '')) > 1000 then
    raise exception 'too_long';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'bad_items';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty not between 1 and 20 then raise exception 'bad_qty'; end if;
    select price, stock, true into v_price, v_stock, v_found
      from products where name = v_item->>'name' and active
      for update;                                   -- чтобы два заказа не купили последнюю штуку
    if v_found is null then raise exception 'unknown_product'; end if;
    if v_stock is not null then
      if v_stock < v_qty then raise exception 'out_of_stock'; end if;
      update products set stock = stock - v_qty where name = v_item->>'name';
    end if;
    v_items := v_items || jsonb_build_object('name', v_item->>'name', 'qty', v_qty, 'price', v_price);
    v_total := v_total + v_price * v_qty;
    v_found := null;
  end loop;

  insert into orders (customer_name, phone, email, address, comment, lang, items, total)
  values (p_name, p_phone, p_email, p_address, p_comment, left(p_lang, 5), v_items, v_total)
  returning id into v_id;
  return v_id;
end;
$body$;
  $fn$;
end $guard$;
revoke all on function public.place_order(text, text, jsonb, text, text, text, text) from public;
grant execute on function public.place_order(text, text, jsonb, text, text, text, text) to anon, authenticated;

-- Отменили заказ в админке — товары возвращаются на склад (и наоборот).
create or replace function public.restock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sign int;
  i jsonb;
begin
  if new.status = old.status then return new; end if;
  if new.status = 'cancelled' then v_sign := 1;
  elsif old.status = 'cancelled' then v_sign := -1;
  else return new; end if;
  for i in select * from jsonb_array_elements(new.items) loop
    update products set stock = greatest(stock + v_sign * (i->>'qty')::int, 0)
      where name = i->>'name' and stock is not null;
  end loop;
  return new;
end;
$$;
revoke all on function public.restock_on_cancel() from public, anon, authenticated;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock
  after update of status on public.orders
  for each row execute function public.restock_on_cancel();

-- ---------- Ваш доступ ----------
-- Сначала создайте себе пользователя: Authentication → Users → Add user → Create new user
-- (почта + пароль, галочка Auto Confirm User). Потом впишите эту почту ниже и запустите файл.
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('ВСТАВЬТЕ_ВАШУ_ПОЧТУ')
on conflict do nothing;
