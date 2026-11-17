-- Perla: цены на золотые изделия считаются автоматически по курсу золота.
-- Раз в сутки база сама берёт курс золота (api.gold-api.com), пересчитывает цены
-- и записывает их в products.price. Вручную в админке ничего менять не нужно.
--
-- Цена = вес (г) × курс 24k за грамм × проба (0.585 = 14k) × (1 + наценка).
-- Товары с pricing = 'gold' пересчитываются, с pricing = 'fixed' (вермейль,
-- Gold Fill, жемчуг) цена остаётся той, что в таблице.
-- Наценку и пробу меняйте в таблице gold_settings (одна строка).

create extension if not exists http with schema extensions;
create extension if not exists pg_cron;

alter table public.products add column if not exists weight numeric(6,2);
alter table public.products add column if not exists pricing text not null default 'fixed'
  check (pricing in ('fixed', 'gold'));

create table if not exists public.gold_settings (
  id         int primary key default 1 check (id = 1),   -- всегда одна строка
  rate_24k   numeric(10,2),                               -- USD за грамм золота 24k
  purity     numeric(4,3) not null default 0.585,         -- проба: 0.585 = 14k
  markup     numeric(4,3) not null default 0.20,          -- наценка за работу, 0.20 = 20%
  updated_at timestamptz,
  source     text
);
insert into public.gold_settings (id) values (1) on conflict do nothing;
alter table public.gold_settings enable row level security;
drop policy if exists gold_settings_read on public.gold_settings;
create policy gold_settings_read on public.gold_settings for select using (true);  -- курс не секрет

-- Пересчёт цен золотых изделий по текущему курсу.
create or replace function public.recalc_prices() returns void
language sql security definer set search_path = public as $$
  update products p
     set price = round(p.weight * s.rate_24k * s.purity * (1 + s.markup)), updated_at = now()
    from gold_settings s
   where s.id = 1 and s.rate_24k is not null
     and p.pricing = 'gold' and p.weight is not null;
$$;

-- Забирает курс золота и пересчитывает цены. Защита: при сбое API или скачке курса
-- больше чем на 8% за раз старые цены остаются (результат — в возвращаемом тексте).
create or replace function public.update_gold_rate() returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  r   extensions.http_response;
  oz  numeric;
  g   numeric;
  old numeric;
begin
  select * into r from extensions.http_get('https://api.gold-api.com/price/XAU');
  if r.status <> 200 then return 'http ' || r.status; end if;
  oz := (r.content::jsonb ->> 'price')::numeric;
  g  := round(oz / 31.1034768, 2);                     -- тройская унция → грамм
  if g is null or g < 40 or g > 600 then return 'bad rate ' || coalesce(g::text, 'null'); end if;
  select rate_24k into old from gold_settings where id = 1;
  if old is not null and abs(g - old) / old > 0.08 then return 'jump rejected ' || g; end if;
  update gold_settings set rate_24k = g, updated_at = now(), source = 'api.gold-api.com' where id = 1;
  perform public.recalc_prices();
  return 'ok ' || g;
exception when others then
  return 'error ' || sqlerrm;
end $$;

revoke all on function public.recalc_prices() from public, anon, authenticated;
revoke all on function public.update_gold_rate() from public, anon, authenticated;

-- Золотые изделия: цена считается по весу. Остальные — фиксированная цена.
update public.products set pricing = 'gold'
 where name not in ('Aurelia Ring', 'Lumin Pearl Drops', 'Sentinel Pendant', 'Forma Cuff', 'Moment Chain', 'Ora Hoops');
-- Вермейль и Gold Fill — $20 за грамм (фиксированно).
update public.products p set price = v.price
  from (values ('Forma Cuff', 160), ('Moment Chain', 70), ('Aurelia Ring', 100),
               ('Ora Hoops', 100), ('Sentinel Pendant', 80)) as v(name, price)
 where p.name = v.name;

-- Каждый день в 02:00 UTC (06:00 по Еревану).
select cron.unschedule('gold-rate-daily') where exists (select 1 from cron.job where jobname = 'gold-rate-daily');
select cron.schedule('gold-rate-daily', '0 2 * * *', 'select public.update_gold_rate()');

-- Первый запуск сразу: select public.update_gold_rate();
