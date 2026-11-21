-- Applied in Supabase project Concha on 2026-11-20.
-- Track when the courier-dispatch email was accepted by the email provider.
-- Kept separate from regular order status; no existing RLS or admin grants changed.
alter table public.orders
  add column if not exists courier_email_sent_at timestamptz;
