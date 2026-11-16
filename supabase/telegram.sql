-- Concha: уведомление в Telegram о каждом новом заказе.
-- Запускать ПОСЛЕ schema.sql. Перед запуском замените две строки ниже
-- (токен бота и ваш chat id) — как их получить, написано в supabase/README.md.
-- Секреты хранятся в Supabase Vault (зашифрованы), а не в коде сайта.

create extension if not exists pg_net;  -- даёт базе возможность отправлять HTTP-запросы

-- Если секреты уже были созданы раньше, этот блок просто обновит их.
do $$
declare
  v_token text := 'ВСТАВЬТЕ_ТОКЕН_БОТА';     -- например 1234567890:AAH...
  v_chat  text := 'ВСТАВЬТЕ_CHAT_ID';         -- например 123456789
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'telegram_bot_token';
  if v_id is null then perform vault.create_secret(v_token, 'telegram_bot_token');
  else perform vault.update_secret(v_id, v_token); end if;

  select id into v_id from vault.secrets where name = 'telegram_chat_id';
  if v_id is null then perform vault.create_secret(v_chat, 'telegram_chat_id');
  else perform vault.update_secret(v_id, v_chat); end if;
end $$;

create or replace function public.notify_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_chat  text;
  v_lines text;
  v_text  text;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'telegram_bot_token';
  select decrypted_secret into v_chat  from vault.decrypted_secrets where name = 'telegram_chat_id';
  if v_token is null or v_chat is null then return new; end if;

  select string_agg(format('• %s × %s = $%s', i->>'name', i->>'qty',
                           ((i->>'price')::numeric * (i->>'qty')::int)), E'\n')
    into v_lines
    from jsonb_array_elements(new.items) as i;

  v_text := format(
    E'🛍 Новый заказ №%s\n\n%s\n\nИтого: $%s\n\n👤 %s\n📞 %s%s%s%s',
    new.id, v_lines, new.total, new.customer_name, new.phone,
    coalesce(E'\n✉️ ' || new.email, ''),
    coalesce(E'\n📍 ' || new.address, ''),
    coalesce(E'\n💬 ' || new.comment, '')
  );

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object('chat_id', v_chat, 'text', v_text)
  );
  return new;
exception when others then
  -- Если Telegram недоступен, заказ всё равно сохраняется.
  raise warning 'telegram notify failed: %', sqlerrm;
  return new;
end;
$$;

revoke all on function public.notify_new_order() from public, anon, authenticated;

drop trigger if exists orders_notify_telegram on public.orders;
create trigger orders_notify_telegram
  after insert on public.orders
  for each row execute function public.notify_new_order();
