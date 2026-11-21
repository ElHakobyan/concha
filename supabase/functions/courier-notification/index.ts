// Supabase Edge Function: courier-notification
// Required secrets: RESEND_API_KEY, COURIER_FROM_EMAIL (verified sender), SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "npm:@supabase/supabase-js@2";
Deno.serve(async (req) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  const reply = (status: number, data: Record<string, unknown>) => new Response(JSON.stringify(data), { status, headers });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("COURIER_FROM_EMAIL");
  if (!url || !anon || !service || !apiKey || !from) return reply(503, { error: "not_configured" });
  const bearer = req.headers.get("Authorization") || "";
  if (!/^Bearer .+/.test(bearer)) return reply(401, { error: "unauthorized" });
  const userDb = createClient(url, anon, { global: { headers: { Authorization: bearer } }, auth: { persistSession: false } });
  const { data: user, error: userError } = await userDb.auth.getUser(bearer.slice(7));
  if (userError || !user.user) return reply(401, { error: "unauthorized" });
  const { data: admin, error: adminError } = await userDb.rpc("is_admin");
  if (adminError || admin !== true) return reply(403, { error: "forbidden" });
  let body: { orderId?: unknown };
  try { body = await req.json(); } catch { return reply(400, { error: "invalid_json" }); }
  const orderId = body.orderId;
  if (!Number.isSafeInteger(orderId) || Number(orderId) < 1) return reply(400, { error: "invalid_order" });
  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data: order, error: orderError } = await db.from("orders")
    .select("id,status,email,lang,courier_email_sent_at").eq("id", orderId).maybeSingle();
  if (orderError) return reply(500, { error: "database_error" });
  if (!order) return reply(404, { error: "not_found" });
  if (order.courier_email_sent_at) return reply(200, { ok: true, alreadySent: true });
  if (order.status === "cancelled" || order.status === "done") return reply(409, { error: "order_not_deliverable" });
  if (!order.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) return reply(422, { error: "customer_email_missing" });
  const now = new Date().toISOString();
  // Atomic claim prevents two administrators sending duplicate emails concurrently.
  const { data: claimed, error: claimError } = await db.from("orders")
    .update({ status: "shipped", courier_email_sent_at: now })
    .eq("id", orderId).is("courier_email_sent_at", null).neq("status", "cancelled").neq("status", "done")
    .select("id").maybeSingle();
  if (claimError) return reply(500, { error: "database_error" });
  if (!claimed) return reply(200, { ok: true, alreadySent: true });
  const hy = order.lang === "hy", en = order.lang === "en";
  const subject = hy ? "Perla — Ձեր պատվերը ճանապարհին է" : en ? "Perla — Your order is on its way" : "Perla — Ваш заказ в пути";
  const message = hy
    ? `Ձեր №${orderId} պատվերը փոխանցվել է առաքիչին։ Սպասվող առաքումը՝ մոտ 30 րոպեից։ Շնորհակալություն, որ ընտրել եք Perla-ն։`
    : en ? `Your order #${orderId} is with our courier. Estimated delivery: approximately 30 minutes. Thank you for choosing Perla!`
    : `Ваш заказ №${orderId} передан курьеру. Ожидаемое время доставки — примерно через 30 минут. Спасибо, что выбрали Perla!`;
  let delivered = false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `perla-courier-${orderId}` },
      body: JSON.stringify({ from, to: [order.email], subject, text: message })
    });
    delivered = res.ok;
  } catch { /* provider unavailable */ }
  if (!delivered) {
    // Keep status shipped (courier was dispatched); release email claim for a later retry.
    await db.from("orders").update({ courier_email_sent_at: null }).eq("id", orderId).eq("courier_email_sent_at", now);
    return reply(502, { error: "email_delivery_failed" });
  }
  return reply(200, { ok: true, alreadySent: false });
});
