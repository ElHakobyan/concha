-- Perla: админка, версия 2.
-- Добавляет: описание товара на 3 языках, несколько фото у товара, архив вместо удаления,
-- скидки (акции) со сроками, баннеры главной страницы из админки.
--
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.
-- Запускать ПОСЛЕ schema.sql и admin.sql (и gold-rate.sql / accounts.sql, если вы их запускали).
-- Всё выполняется одной транзакцией: если хоть одна команда или проверка не пройдёт,
-- не применится ничего. Запускать повторно безопасно: данные не удаляются и не дублируются.
-- Таблицу admins, функцию is_admin(), заказы, подписчиков и профили покупателей не меняет.

begin;

-- ---------- 1. Товары: описание, доп. фото, архив ----------
alter table public.products add column if not exists desc_en text;
alter table public.products add column if not exists desc_ru text;
alter table public.products add column if not exists desc_hy text;
alter table public.products add column if not exists images text[] not null default '{}';  -- доп. фото (главное — в img)
alter table public.products add column if not exists archived boolean not null default false;
alter table public.products add column if not exists archived_at timestamptz;

-- Посетители видят только включённые и не архивные товары. Администратор — все.
drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated using ((active and not archived) or public.is_admin());

-- ---------- 2. Скидки (акции) ----------
create table if not exists public.promotions (
  id          bigint generated always as identity primary key,
  name        text not null check (length(name) between 1 and 100),
  percent     numeric(5,2) not null check (percent > 0 and percent < 100),
  scope       text not null default 'all' check (scope in ('all', 'category', 'products')),
  category    text,                                  -- для scope = 'category': rings, earrings, ...
  products    text[] not null default '{}',          -- для scope = 'products': названия товаров
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,                           -- пусто = без срока окончания
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
alter table public.promotions enable row level security;

-- Посетители видят только идущие сейчас акции (чтобы показать цену со скидкой).
drop policy if exists "public reads current promotions" on public.promotions;
create policy "public reads current promotions" on public.promotions
  for select to anon, authenticated
  using ((active and starts_at <= now() and (ends_at is null or ends_at > now())) or public.is_admin());
drop policy if exists "admin manages promotions" on public.promotions;
create policy "admin manages promotions" on public.promotions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.promotions from anon, authenticated;
grant select on public.promotions to anon, authenticated;
grant insert, update, delete on public.promotions to authenticated;   -- RLS пускает только администратора

-- Самая большая скидка (в %), которая сейчас действует на товар.
create or replace function public.product_discount(p_name text, p_category text)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(max(percent), 0) from promotions
   where active and starts_at <= now() and (ends_at is null or ends_at > now())
     and (scope = 'all'
          or (scope = 'category' and category = p_category)
          or (scope = 'products' and p_name = any(products)));
$$;
-- Вызывается только изнутри place_order; напрямую через сайт её вызвать нельзя.
revoke all on function public.product_discount(text, text) from public, anon, authenticated;

-- ---------- 3. Баннеры (слайды на главной) ----------
create table if not exists public.banners (
  id          bigint generated always as identity primary key,
  img         text not null check (img ~ '^(https://[^\s''"()<>\\]+|assets/[A-Za-z0-9._/-]+)$'),  -- только https-ссылка или файл сайта
  size        text not null default 'cover' check (size in ('cover', 'auto 100%')),  -- заполнить / целиком
  sort        int not null default 100,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.banners enable row level security;
drop policy if exists "public reads active banners" on public.banners;
create policy "public reads active banners" on public.banners
  for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admin manages banners" on public.banners;
create policy "admin manages banners" on public.banners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.banners from anon, authenticated;
grant select on public.banners to anon, authenticated;
grant insert, update, delete on public.banners to authenticated;

-- Текущие слайды сайта переносим в таблицу (только если она пустая).
insert into public.banners (img, size, sort)
select v.img, v.size, v.sort
  from (values ('assets/hero.png', 'auto 100%', 10), ('assets/hero2.jpg', 'cover', 20),
               ('assets/hero3.jpg', 'cover', 30), ('assets/hero4.jpg', 'cover', 40)) as v(img, size, sort)
 where not exists (select 1 from public.banners);

-- ---------- 4. Заказ: учитывает архив и скидки ----------
-- То же, что в admin.sql (проверка и списание остатка), плюс:
-- архивный товар заказать нельзя, а цена считается со скидкой, которая действует сейчас.
-- Формат items прежний: [{name, qty, price}], к нему добавлено поле discount (%), если была скидка.
create or replace function public.place_order(
  p_name text, p_phone text, p_items jsonb,
  p_email text default null, p_address text default null,
  p_comment text default null, p_lang text default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_total numeric(10,2) := 0;
  v_item  jsonb;
  v_qty   int;
  v_price numeric(10,2);
  v_cat   text;
  v_disc  numeric;
  v_stock int;
  v_found boolean;
  v_line  jsonb;
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
  if p_email is not null and (length(p_email) > 254 or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') then
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
    v_found := null;
    select price, category, stock, true into v_price, v_cat, v_stock, v_found
      from products where name = v_item->>'name' and active and not archived
      for update;
    if v_found is null then raise exception 'unknown_product'; end if;
    if v_stock is not null then
      if v_stock < v_qty then raise exception 'out_of_stock'; end if;
      update products set stock = stock - v_qty where name = v_item->>'name';
    end if;
    v_disc := public.product_discount(v_item->>'name', v_cat);
    if v_disc > 0 then v_price := round(v_price * (1 - v_disc / 100), 2); end if;
    v_line := jsonb_build_object('name', v_item->>'name', 'qty', v_qty, 'price', v_price);
    if v_disc > 0 then v_line := v_line || jsonb_build_object('discount', v_disc); end if;
    v_items := v_items || v_line;
    v_total := v_total + v_price * v_qty;
  end loop;

  insert into orders (customer_name, phone, email, address, comment, lang, items, total)
  values (p_name, p_phone, p_email, p_address, p_comment, left(p_lang, 5), v_items, v_total)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.place_order(text, text, jsonb, text, text, text, text) from public;
grant execute on function public.place_order(text, text, jsonb, text, text, text, text) to anon, authenticated;

-- ---------- 5. Лишние права ----------
-- У гостей и покупателей по умолчанию есть TRUNCATE (очистить таблицу целиком в обход RLS),
-- TRIGGER и REFERENCES. Через сайт ими не воспользоваться, но держать их незачем.
do $$
declare t text;
begin
  foreach t in array array['products', 'orders', 'subscribers', 'site_texts', 'promotions', 'banners', 'admins'] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t);
    end if;
  end loop;
end $$;

-- ---------- 6. Проверки ----------
do $$
begin
  if (select count(*) from public.admins) < 1 then
    raise exception 'Проверка: таблица admins пуста';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products'
                 and policyname = 'public reads active products') then
    raise exception 'Проверка: нет политики чтения товаров';
  end if;
  if exists (select 1 from information_schema.role_table_grants
             where table_schema = 'public' and table_name in ('promotions', 'banners')
               and grantee in ('anon', 'PUBLIC') and privilege_type <> 'SELECT') then
    raise exception 'Проверка: у гостей лишние права на promotions/banners';
  end if;
  if (select count(*) from public.banners) < 1 then
    raise exception 'Проверка: баннеры не перенесены';
  end if;
  if has_function_privilege('anon', 'public.product_discount(text, text)', 'execute') then
    raise exception 'Проверка: product_discount не должна вызываться гостями';
  end if;
  if not has_function_privilege('anon', 'public.place_order(text, text, jsonb, text, text, text, text)', 'execute') then
    raise exception 'Проверка: сайт не сможет оформлять заказы';
  end if;
  if (select prosecdef from pg_proc where oid = 'public.place_order(text, text, jsonb, text, text, text, text)'::regprocedure) is not true
     or not exists (select 1 from pg_proc where oid = 'public.place_order(text, text, jsonb, text, text, text, text)'::regprocedure
                    and prosrc like '%product_discount%' and prosrc like '%not archived%') then
    raise exception 'Проверка: place_order не обновилась';
  end if;
  if exists (select 1 from pg_class c where c.relnamespace = 'public'::regnamespace
             and c.relname in ('products', 'orders', 'subscribers', 'site_texts', 'promotions', 'banners', 'admins')
             and not c.relrowsecurity) then
    raise exception 'Проверка: на одной из таблиц выключен Row Level Security';
  end if;
end $$;

commit;

-- После запуска можно выполнить отдельно, чтобы посмотреть результат:
-- select (select count(*) from products) products, (select count(*) from banners) banners,
--        (select count(*) from promotions) promotions, (select count(*) from admins) admins;
