-- Проверка прав доступа на чистой базе. Запуск:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/permissions.sql
-- Любая неожиданность останавливает проверку с ошибкой. В конце всё откатывается.
begin;

-- 1. Посетитель (anon) читает то, что нужно витрине.
do $$
begin
  set local role anon;
  perform 1 from public.products limit 1;
  perform 1 from public.site_texts limit 1;
  perform 1 from public.gold_settings limit 1;
  reset role;
end $$;

-- 2. Посетитель не читает и не меняет остальное.
do $$
declare q text;
begin
  foreach q in array array[
    'select 1 from public.orders',
    'select 1 from public.subscribers',
    'select 1 from public.admins',
    'insert into public.products (name, price) values (''hack'', 1)',
    'update public.products set price = 1',
    'delete from public.products',
    'truncate public.products'
  ] loop
    set local role anon;
    begin
      execute q;
      reset role;
      raise exception 'anon не должен был выполнить: %', q;
    exception when insufficient_privilege then
      reset role;
    end;
  end loop;
end $$;

-- 3. Посетитель может оформить заказ и подписаться через функции.
do $$
declare v_id bigint;
begin
  set local role anon;
  v_id := public.place_order('Test', '+37499123456',
            '[{"name":"Aurelia Ring","qty":1}]'::jsonb);
  perform public.subscribe('test@example.com', 'en');
  reset role;
  if v_id is null then raise exception 'place_order не вернул номер заказа'; end if;
end $$;

-- 4. Вошедший, но не админ: заказы не видит и товары менять не может.
do $$
declare n int;
begin
  set local role authenticated;
  select count(*) into n from public.orders;
  if n <> 0 then raise exception 'не-админ видит заказы: %', n; end if;
  begin
    update public.products set price = 1;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'не-админ изменил товары: %', n; end if;
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

rollback;
