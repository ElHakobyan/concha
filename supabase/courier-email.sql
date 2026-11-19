-- Run once in Supabase SQL Editor before deploying courier-notification.
-- Deduplication marker: set before sending; cleared on provider failure for retry.
alter table public.orders add column if not exists courier_email_sent_at timestamptz;
revoke all (courier_email_sent_at) on public.orders from anon, authenticated;
-- If table-level UPDATE grants exist, explicitly remove them and regrant status only.
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;
