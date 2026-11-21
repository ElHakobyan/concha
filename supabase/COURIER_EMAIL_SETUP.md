# Perla: courier email notification

When an admin changes an order to **Отправлен** (handed to courier), the `courier-notification` Edge Function verifies the admin JWT, marks the order as shipped, and sends a single email estimating delivery in ~30 minutes.

## Setup (required before merge/deploy)
1. Run `supabase/courier-email.sql` in the existing Supabase project's SQL Editor.
2. Create a Resend account, verify a domain you control (DNS records in Cloudflare), and create an API key. Never put the key in `config.js` or frontend files.
3. In Supabase Edge Function secrets, set `RESEND_API_KEY` and `COURIER_FROM_EMAIL` (e.g. `Perla <orders@your-verified-domain>`). Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as environment secrets.
4. Deploy `supabase/functions/courier-notification/index.ts` as an Edge Function named `courier-notification` with JWT verification enabled.
5. Test with an admin account and an order with a test email. Check only one email is sent if the action is repeated. Test non-admin access is rejected.

## Limitations
- This is an **estimated** 30 minutes, not GPS-based.
- If the email provider fails, the order remains shipped and the admin sees an error. Retrying the action is possible by selecting another eligible status and then shipped again; provider idempotency reduces duplicates.
- An HTTP success from the provider confirms acceptance, **not inbox delivery**.
- Existing admin status options remain; no automatic completion step is added.
- Do not merge until credentials, SQL migration, deployment, and end-to-end testing are complete.
