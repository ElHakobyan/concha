-- Concha: база данных для заказов и рассылки (Supabase / PostgreSQL).
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.
-- Файл можно запускать повторно: он ничего не удаляет и не дублирует.

-- ---------- Товары (цены для проверки заказов) ----------
-- Сайт пока берёт каталог из script.js, а эта таблица нужна, чтобы сервер сам
-- считал сумму заказа: покупатель не сможет подменить цену в браузере.
-- Если меняете цену в script.js, поменяйте её и здесь (Table Editor → products).
create table if not exists public.products (
  name       text primary key,
  price      numeric(10,2) not null check (price >= 0),
  category   text,
  active     boolean not null default true  -- false = товар нельзя заказать
);

insert into public.products (name, price, category) values
  ('Aurelia Ring', 98, 'rings'),
  ('Lumin Pearl Drops', 128, 'earrings'),
  ('Sentinel Pendant', 98, 'necklaces'),
  ('Forma Cuff', 148, 'bracelets'),
  ('Moment Chain', 68, 'chains'),
  ('Ora Hoops', 108, 'earrings'),
  ('Selene Band', 68, 'rings'),
  ('Lyra Leaf Ring', 78, 'rings'),
  ('Thalia Ring', 88, 'rings'),
  ('Iris Filigree Ring', 98, 'rings'),
  ('Daphne Ring', 108, 'rings'),
  ('Aura Signet', 118, 'rings'),
  ('Nyx Hoops', 58, 'earrings'),
  ('Mira Hoops', 68, 'earrings'),
  ('Luna Crescents', 88, 'earrings'),
  ('Ariadne Drops', 98, 'earrings'),
  ('Eros Hoops', 118, 'earrings'),
  ('Taurus Studs', 108, 'earrings'),
  ('Aria Thread', 88, 'necklaces'),
  ('Calypso Chain', 98, 'necklaces'),
  ('Hestia Collar', 128, 'necklaces'),
  ('Dione Fringe', 138, 'necklaces'),
  ('Rhea Beads', 108, 'necklaces'),
  ('Phoebe Pendants', 148, 'necklaces'),
  ('Echo Serpent', 128, 'bracelets'),
  ('Gaia Cuff', 118, 'bracelets'),
  ('Twin Bangles', 98, 'bracelets'),
  ('Carnelian Twist', 158, 'bracelets'),
  ('Ember Bands', 88, 'bracelets'),
  ('Thread Band', 68, 'bracelets'),
  ('Wisp Chain', 58, 'chains'),
  ('Silk Chain', 68, 'chains'),
  ('Amber Drop Chain', 98, 'chains'),
  ('Pendant Chain', 88, 'chains'),
  ('Clasp Chain', 78, 'chains'),
  ('Trio Chain', 98, 'chains')

on conflict (name) do update set price = excluded.price, category = excluded.category;

-- ---------- Заказы ----------
create table if not exists public.orders (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  status         text not null default 'new'
                 check (status in ('new', 'confirmed', 'shipped', 'done', 'cancelled')),
  customer_name  text not null,
  phone          text not null,
  email          text,
  address        text,
  comment        text,
  lang           text,
  items          jsonb not null,           -- [{ "name": ..., "qty": ..., "price": ... }]
  total          numeric(10,2) not null
);

-- ---------- Подписчики рассылки ----------
create table if not exists public.subscribers (
  email       text primary key,
  lang        text,
  created_at  timestamptz not null default now()
);

-- ---------- Защита ----------
-- Row Level Security без политик: посетители сайта НЕ могут читать или менять
-- таблицы напрямую. Они могут только вызвать две функции ниже.
-- Вы видите всё в панели Supabase (Table Editor), там защита не мешает.
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.subscribers enable row level security;

-- ---------- Функция: оформить заказ ----------
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
    select price into v_price from products where name = v_item->>'name' and active;
    if v_price is null then raise exception 'unknown_product'; end if;
    v_items := v_items || jsonb_build_object('name', v_item->>'name', 'qty', v_qty, 'price', v_price);
    v_total := v_total + v_price * v_qty;
  end loop;

  insert into orders (customer_name, phone, email, address, comment, lang, items, total)
  values (p_name, p_phone, p_email, p_address, p_comment, left(p_lang, 5), v_items, v_total)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- Функция: подписаться на рассылку ----------
create or replace function public.subscribe(p_email text, p_lang text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  p_email := lower(btrim(p_email));
  if p_email is null or length(p_email) > 254 or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'bad_email';
  end if;
  insert into subscribers (email, lang) values (p_email, left(p_lang, 5))
  on conflict (email) do nothing;  -- повторная подписка не считается ошибкой
end;
$$;

-- Разрешаем сайту вызывать только эти две функции.
revoke all on function public.place_order(text, text, jsonb, text, text, text, text) from public;
revoke all on function public.subscribe(text, text) from public;
grant execute on function public.place_order(text, text, jsonb, text, text, text, text) to anon, authenticated;
grant execute on function public.subscribe(text, text) to anon, authenticated;
