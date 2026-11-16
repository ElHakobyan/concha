-- Concha: письмо на вашу почту о каждом новом заказе (через сервис Resend).
-- Запускать ПОСЛЕ schema.sql. Перед запуском замените две строки ниже
-- (ключ Resend и вашу почту) — как их получить, написано в supabase/README.md.
-- Секреты хранятся в Supabase Vault (зашифрованы), а не в коде сайта.

create extension if not exists pg_net;  -- даёт базе возможность отправлять HTTP-запросы

-- Если секреты уже были созданы раньше, этот блок просто обновит их.
do $$
declare
  v_key   text := 'ВСТАВЬТЕ_КЛЮЧ_RESEND';   -- например re_123abc...
  v_email text := 'ВСТАВЬТЕ_ВАШУ_ПОЧТУ';    -- та же почта, с которой вы зарегистрировались в Resend
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'resend_api_key';
  if v_id is null then perform vault.create_secret(v_key, 'resend_api_key');
  else perform vault.update_secret(v_id, v_key); end if;

  select id into v_id from vault.secrets where name = 'order_notify_email';
  if v_id is null then perform vault.create_secret(v_email, 'order_notify_email');
  else perform vault.update_secret(v_id, v_email); end if;
end $$;

create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key   text;
  v_to    text;
  v_lines text;
  v_text  text;
  v_body  jsonb;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  select decrypted_secret into v_to  from vault.decrypted_secrets where name = 'order_notify_email';
  if v_key is null or v_to is null then return new; end if;

  select string_agg(format('• %s × %s = $%s', i->>'name', i->>'qty',
                           ((i->>'price')::numeric * (i->>'qty')::int)), E'\n')
    into v_lines
    from jsonb_array_elements(new.items) as i;

  v_text := format(
    E'Новый заказ №%s\n\n%s\n\nИтого: $%s\n\nИмя: %s\nТелефон: %s%s%s%s\n\nВсе заказы: Supabase → Table Editor → orders',
    new.id, v_lines, new.total, new.customer_name, new.phone,
    coalesce(E'\nEmail: ' || new.email, ''),
    coalesce(E'\nАдрес: ' || new.address, ''),
    coalesce(E'\nКомментарий: ' || new.comment, '')
  );

  v_body := jsonb_build_object(
    'from', 'Concha <onboarding@resend.dev>',
    'to', jsonb_build_array(v_to),
    'subject', format('Новый заказ №%s — $%s', new.id, new.total),
    'text', v_text
  );
  -- «Ответить» в письме сразу пишет покупателю, если он оставил email.
  if new.email is not null then v_body := v_body || jsonb_build_object('reply_to', new.email); end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    body := v_body,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json')
  );
  return new;
exception when others then
  -- Если почтовый сервис недоступен, заказ всё равно сохраняется.
  raise warning 'order email failed: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.notify_new_order() from public, anon, authenticated;

drop trigger if exists orders_notify_telegram on public.orders;
drop trigger if exists orders_notify_email on public.orders;
create trigger orders_notify_email
  after insert on public.orders
  for each row execute function public.notify_new_order();
