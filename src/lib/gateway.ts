// The payment engine: creating orders, charging test cards, 3-D Secure,
// refunds, captures, disputes and server callbacks.

import { sql, sqlOne } from "./db";
import { CURRENCIES } from "./brand";
import { randomDigits, randomId } from "./ids";
import { sign } from "./signature";
import { orderTime } from "./dates";
import { cardBrand, findTestCard, luhnValid, maskCard, THREE_DS_CODE, type CardOutcome } from "./testcards";
import { isHttpUrl, isPrivateUrl } from "./url";
import { notify } from "./notify";
import { formatMoney } from "./money";

export type Merchant = {
  id: number;
  merchant_id: number;
  user_id: number;
  company_id: number | null;
  name: string;
  url: string;
  secret_key: string;
  callback_url: string;
  allow_unsigned: boolean;
  fee_bps: number;
  active: boolean;
  created_at: Date;
};

export type PaymentStatus = "created" | "processing" | "approved" | "declined" | "expired" | "reversed";

export type Payment = {
  id: number;
  payment_id: number;
  merchant_ref: number;
  order_id: string;
  order_desc: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  token: string;
  source: string;
  signed: boolean;
  response_url: string;
  server_callback_url: string;
  sender_email: string;
  merchant_data: string;
  lang: string;
  preauth: boolean;
  captured: boolean;
  captured_at: Date | null;
  reversal_amount: number;
  masked_card: string;
  card_bin: string;
  card_type: string;
  card_holder: string;
  rrn: string;
  approval_code: string;
  response_code: string;
  response_description: string;
  pending: { outcome: CardOutcome; attempts: number; masked: string; holder: string } | null;
  expires_at: Date;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

/** Error returned by the public API — `code` is shown to the developer. */
export class GatewayError extends Error {
  constructor(
    public code: number,
    message: string,
    public extra: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const DEFAULT_LIFETIME = 3600; // seconds a checkout link stays valid
export const MAX_AMOUNT = 100_000_000; // 1,000,000.00 in minor units

// ── Lookups ──────────────────────────────────────────────────────────────────
export async function merchantByPublicId(merchantId: unknown): Promise<Merchant | null> {
  const n = Number(merchantId);
  if (!Number.isInteger(n) || n <= 0) return null;
  return sqlOne<Merchant>("SELECT * FROM merchants WHERE merchant_id = $1", [n]);
}

export async function merchantByRef(id: number): Promise<Merchant | null> {
  return sqlOne<Merchant>("SELECT * FROM merchants WHERE id = $1", [id]);
}

export async function paymentByToken(token: string): Promise<Payment | null> {
  await expireStale();
  return sqlOne<Payment>("SELECT * FROM payments WHERE token = $1", [token]);
}

export async function paymentByOrderId(merchant: Merchant, orderId: unknown): Promise<Payment | null> {
  await expireStale();
  return sqlOne<Payment>("SELECT * FROM payments WHERE merchant_ref = $1 AND order_id = $2", [merchant.id, String(orderId ?? "")]);
}

/** Orders that were never paid become `expired` once their lifetime is over. */
export async function expireStale() {
  await sql(
    `UPDATE payments
        SET status = 'expired', pending = NULL, updated_at = now(),
            response_description = 'Order lifetime expired'
      WHERE status IN ('created', 'processing') AND expires_at < now()`,
  );
}

// ── Creating an order ────────────────────────────────────────────────────────
export type OrderInput = Record<string, unknown>;

function str(v: unknown): string {
  return v === undefined || v === null ? "" : String(v).trim();
}

export async function createOrder(
  merchant: Merchant,
  input: OrderInput,
  opts: { source: "api" | "sdk" | "link" | "playground"; signed: boolean },
): Promise<Payment> {
  if (!merchant.active) throw new GatewayError(1003, "Merchant is disabled. Enable it in Merchant settings.");

  for (const field of ["order_id", "order_desc", "amount", "currency"]) {
    if (str(input[field]) === "") throw new GatewayError(1001, `Required parameter is missing: ${field}`);
  }

  const orderId = str(input.order_id);
  if (orderId.length > 100) throw new GatewayError(1004, "Parameter `order_id` is too long (max 100 characters)");

  const orderDesc = str(input.order_desc);
  if (orderDesc.length > 1024) throw new GatewayError(1004, "Parameter `order_desc` is too long (max 1024 characters)");

  const amountRaw = str(input.amount);
  if (!/^\d+$/.test(amountRaw)) {
    throw new GatewayError(1004, "Parameter `amount` must be a whole number in minor units (cents/tetri). Example: 25.50 GEL → 2550");
  }
  const amount = Number(amountRaw);
  if (amount <= 0 || amount > MAX_AMOUNT) throw new GatewayError(1004, `Parameter \`amount\` must be between 1 and ${MAX_AMOUNT}`);

  const currency = str(input.currency).toUpperCase();
  if (!(CURRENCIES as readonly string[]).includes(currency)) {
    throw new GatewayError(1005, `Unsupported currency "${currency}". Use one of: ${CURRENCIES.join(", ")}`);
  }

  const responseUrl = str(input.response_url);
  if (responseUrl && !isHttpUrl(responseUrl)) throw new GatewayError(1004, "Parameter `response_url` must be a full http(s) URL");
  const callbackUrl = str(input.server_callback_url);
  if (callbackUrl && !isHttpUrl(callbackUrl)) throw new GatewayError(1004, "Parameter `server_callback_url` must be a full http(s) URL");

  const lifetimeRaw = str(input.lifetime);
  let lifetime = DEFAULT_LIFETIME;
  if (lifetimeRaw) {
    lifetime = Number(lifetimeRaw);
    if (!Number.isInteger(lifetime) || lifetime < 60 || lifetime > 604800) {
      throw new GatewayError(1004, "Parameter `lifetime` must be between 60 and 604800 seconds");
    }
  }

  const preauth = str(input.preauth).toUpperCase() === "Y";
  const email = str(input.sender_email).slice(0, 200);
  const merchantData = str(input.merchant_data).slice(0, 2048);
  const lang = str(input.lang).slice(0, 5) || "en";

  await expireStale();
  const existing = await sqlOne<Payment>("SELECT * FROM payments WHERE merchant_ref = $1 AND order_id = $2", [merchant.id, orderId]);
  if (existing) {
    // Re-sending the same unpaid order returns the same checkout (safe page refresh).
    if (existing.status === "created" && existing.amount === amount && existing.currency === currency) return existing;
    throw new GatewayError(1013, `Duplicate order_id "${orderId}". Every payment needs a new unique order_id.`);
  }

  const created = await sqlOne<Payment>(
    `INSERT INTO payments (merchant_ref, order_id, order_desc, amount, currency, token, source, signed,
                           response_url, server_callback_url, sender_email, merchant_data, lang, preauth, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now() + ($15::int * interval '1 second'))
     ON CONFLICT (merchant_ref, order_id) DO NOTHING
     RETURNING *`,
    [
      merchant.id,
      orderId,
      orderDesc,
      amount,
      currency,
      randomId(32),
      opts.source,
      opts.signed,
      responseUrl,
      callbackUrl,
      email,
      merchantData,
      lang,
      preauth,
      lifetime,
    ],
  );
  if (!created) throw new GatewayError(1013, `Duplicate order_id "${orderId}". Every payment needs a new unique order_id.`);
  return created;
}

// ── What the merchant receives (redirect, callback, status API) ─────────────
export function responseParams(p: Payment, m: Merchant, extra: Record<string, string | number> = {}) {
  const params: Record<string, string | number> = {
    order_id: p.order_id,
    merchant_id: m.merchant_id,
    payment_id: p.payment_id,
    order_status: p.status,
    response_status: "success",
    tran_type: "purchase",
    amount: p.amount,
    currency: p.currency,
    actual_amount: p.amount,
    actual_currency: p.currency,
    reversal_amount: p.reversal_amount,
    sender_email: p.sender_email,
    masked_card: p.masked_card,
    card_bin: p.card_bin,
    card_type: p.card_type,
    rrn: p.rrn,
    approval_code: p.approval_code,
    response_code: p.response_code,
    response_description: p.response_description,
    order_time: orderTime(new Date(p.created_at)),
    merchant_data: p.merchant_data,
    ...(p.preauth ? { preauth: "Y", captured: p.captured ? "Y" : "N" } : {}),
    ...extra,
  };
  // Drop empty values so the payload stays readable (they are skipped in the signature anyway).
  for (const k of Object.keys(params)) if (params[k] === "") delete params[k];
  return { ...params, signature: sign(m.secret_key, params) };
}

// ── Charging a card on the hosted checkout ───────────────────────────────────
export type CardInput = { number: string; expiry: string; cvv: string; holder: string; email: string };

export type ChargeResult =
  { kind: "error"; message: string; field?: "number" | "expiry" | "cvv" | "email" } | { kind: "threeDS" } | { kind: "done"; payment: Payment };

export async function chargeCard(token: string, card: CardInput): Promise<ChargeResult> {
  const payment = await paymentByToken(token);
  if (!payment) return { kind: "error", message: "Payment not found." };
  if (payment.status !== "created") return { kind: "done", payment };

  const number = card.number.replace(/\D/g, "");
  if (!luhnValid(number)) return { kind: "error", field: "number", message: "Card number is not valid." };

  const exp = card.expiry.replace(/\s/g, "").match(/^(\d{2})\/?(\d{2})$/);
  if (!exp || Number(exp[1]) < 1 || Number(exp[1]) > 12) {
    return { kind: "error", field: "expiry", message: "Use MM/YY format." };
  }
  const now = new Date();
  const expYear = 2000 + Number(exp[2]);
  const expMonth = Number(exp[1]);
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
    return { kind: "error", field: "expiry", message: "This card has expired." };
  }
  if (!/^\d{3,4}$/.test(card.cvv)) return { kind: "error", field: "cvv", message: "CVV must be 3 digits." };
  if (card.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(card.email)) {
    return { kind: "error", field: "email", message: "E-mail address looks wrong." };
  }

  const outcome = findTestCard(number);
  if (!outcome) {
    return {
      kind: "error",
      field: "number",
      message: "Sandbox mode: only test cards are accepted. Pick one from the “Test cards” list.",
    };
  }

  const masked = maskCard(number);
  const holder = card.holder.trim().slice(0, 100);
  const email = card.email.trim() || payment.sender_email;

  if (outcome.threeDS) {
    const updated = await sqlOne<Payment>(
      `UPDATE payments SET status = 'processing', pending = $2::jsonb, sender_email = $3, updated_at = now()
        WHERE id = $1 AND status = 'created' RETURNING *`,
      [payment.id, JSON.stringify({ outcome, attempts: 0, masked, holder }), email],
    );
    if (!updated) return { kind: "done", payment: (await paymentByToken(token))! };
    return { kind: "threeDS" };
  }

  const done = await finalize(payment, outcome, masked, holder, email);
  return { kind: "done", payment: done };
}

export async function submitThreeDS(token: string, code: string, cancel: boolean): Promise<ChargeResult> {
  const payment = await paymentByToken(token);
  if (!payment) return { kind: "error", message: "Payment not found." };
  if (payment.status !== "processing" || !payment.pending) return { kind: "done", payment };
  const { outcome, masked, holder } = payment.pending;

  if (cancel) {
    const failed: CardOutcome = { ...outcome, result: "declined", responseCode: "82", responseDescription: "3-D Secure cancelled by customer" };
    return { kind: "done", payment: await finalize(payment, failed, masked, holder, payment.sender_email) };
  }

  if (code.trim() !== THREE_DS_CODE) {
    const attempts = payment.pending.attempts + 1;
    if (attempts >= 3) {
      const failed: CardOutcome = { ...outcome, result: "declined", responseCode: "82", responseDescription: "3-D Secure authentication failed" };
      return { kind: "done", payment: await finalize(payment, failed, masked, holder, payment.sender_email) };
    }
    await sql("UPDATE payments SET pending = $2::jsonb WHERE id = $1", [payment.id, JSON.stringify({ ...payment.pending, attempts })]);
    return { kind: "error", message: `Wrong code. ${3 - attempts} attempt${3 - attempts === 1 ? "" : "s"} left.` };
  }

  return { kind: "done", payment: await finalize(payment, outcome, masked, holder, payment.sender_email) };
}

async function finalize(payment: Payment, outcome: CardOutcome, masked: string, holder: string, email: string): Promise<Payment> {
  const approved = outcome.result === "approved";
  const updated = await sqlOne<Payment>(
    `UPDATE payments SET
        status = $2, masked_card = $3, card_bin = $4, card_type = $5, card_holder = $6, sender_email = $7,
        rrn = $8, approval_code = $9, response_code = $10, response_description = $11,
        captured = $12, captured_at = CASE WHEN $12 THEN now() ELSE NULL END,
        paid_at = CASE WHEN $2 = 'approved' THEN now() ELSE NULL END,
        pending = NULL, updated_at = now()
      WHERE id = $1 AND status IN ('created', 'processing')
      RETURNING *`,
    [
      payment.id,
      approved ? "approved" : "declined",
      masked,
      masked.slice(0, 6),
      cardBrand(masked),
      holder,
      email,
      approved ? randomDigits(12) : "",
      approved ? randomId(6).toUpperCase() : "",
      outcome.responseCode,
      outcome.responseDescription,
      approved && !payment.preauth,
    ],
  );
  // Someone else (double click) finished it first.
  if (!updated) return (await sqlOne<Payment>("SELECT * FROM payments WHERE id = $1", [payment.id]))!;

  const merchant = (await merchantByRef(updated.merchant_ref))!;

  if (approved && outcome.dispute) {
    await sql(
      `INSERT INTO disputes (payment_ref, reason_code, reason, amount, due_at)
       VALUES ($1, '13.1', 'Merchandise / services not received', $2, now() + interval '7 days')`,
      [updated.id, updated.amount],
    );
    await notify(merchant.user_id, {
      kind: "warning",
      title: "New dispute opened",
      body: `The customer disputed order ${updated.order_id} (${formatMoney(updated.amount, updated.currency)}). Respond within 7 days.`,
      link: "/portal/disputes",
    });
  }

  await sendCallback(updated, merchant, "purchase");
  return updated;
}

// ── Refunds & captures ───────────────────────────────────────────────────────
export async function refundPayment(
  payment: Payment,
  merchant: Merchant,
  amount: number,
  comment: string,
  source: "portal" | "api" | "chargeback",
): Promise<Payment> {
  if (payment.status !== "approved") {
    throw new GatewayError(1016, `Only approved payments can be refunded (this one is "${payment.status}").`);
  }
  const available = payment.amount - payment.reversal_amount;
  if (!Number.isInteger(amount) || amount <= 0) throw new GatewayError(1004, "Refund amount must be a positive whole number in minor units.");
  if (amount > available) throw new GatewayError(1015, `Refund amount is larger than the available amount (${available}).`);

  const updated = await sqlOne<Payment>(
    `UPDATE payments SET reversal_amount = reversal_amount + $2,
            status = CASE WHEN reversal_amount + $2 >= amount THEN 'reversed' ELSE status END,
            updated_at = now()
      WHERE id = $1 AND status = 'approved' AND reversal_amount + $2 <= amount
      RETURNING *`,
    [payment.id, amount],
  );
  if (!updated) throw new GatewayError(1015, "Refund could not be applied — the payment changed. Reload and try again.");
  await sql("INSERT INTO refunds (payment_ref, amount, comment, source) VALUES ($1, $2, $3, $4)", [
    payment.id,
    amount,
    comment.slice(0, 500),
    source,
  ]);
  await sendCallback(updated, merchant, "reverse");
  return updated;
}

export async function capturePayment(payment: Payment, merchant: Merchant): Promise<Payment> {
  if (!payment.preauth) throw new GatewayError(1016, "This payment was not created with preauth = Y, it is captured automatically.");
  if (payment.status !== "approved") throw new GatewayError(1016, `Only approved payments can be captured (this one is "${payment.status}").`);
  if (payment.captured) return payment;
  const updated = await sqlOne<Payment>("UPDATE payments SET captured = TRUE, captured_at = now(), updated_at = now() WHERE id = $1 RETURNING *", [
    payment.id,
  ]);
  await sendCallback(updated!, merchant, "capture");
  return updated!;
}

// ── Disputes (simulated card-network chargebacks) ────────────────────────────
// Evidence is "reviewed by the bank" two minutes after it is submitted.
export async function resolveDisputes() {
  const due = await sql<{ id: number; payment_ref: number; status: string; evidence: string }>(
    `SELECT id, payment_ref, status, evidence FROM disputes
      WHERE (status = 'under_review' AND evidence_at < now() - interval '2 minutes')
         OR (status = 'needs_response' AND due_at < now())`,
  );
  for (const d of due) {
    const won = d.status === "under_review" && d.evidence.trim().length >= 40;
    const res = await sqlOne(
      `UPDATE disputes SET status = $2, resolved_at = now() WHERE id = $1 AND status IN ('under_review','needs_response') RETURNING id`,
      [d.id, won ? "won" : "lost"],
    );
    if (!res) continue;
    await disputeClosed(d.id, d.payment_ref, won);
  }
}

export async function disputeClosed(disputeId: number, paymentRef: number, won: boolean) {
  const payment = await sqlOne<Payment>("SELECT * FROM payments WHERE id = $1", [paymentRef]);
  if (!payment) return;
  const merchant = (await merchantByRef(payment.merchant_ref))!;
  if (!won && payment.status === "approved") {
    const left = payment.amount - payment.reversal_amount;
    if (left > 0) await refundPayment(payment, merchant, left, "Chargeback lost", "chargeback").catch(() => {});
  }
  await notify(merchant.user_id, {
    kind: won ? "success" : "danger",
    title: won ? "Dispute won" : "Dispute lost",
    body: won
      ? `The bank accepted your evidence for order ${payment.order_id}. The money stays with you.`
      : `Order ${payment.order_id} was charged back to the customer.`,
    link: "/portal/disputes?tab=closed",
  });
}

// ── Server callbacks (webhooks) ──────────────────────────────────────────────
export async function sendCallback(payment: Payment, merchant: Merchant, event: "purchase" | "reverse" | "capture" | "manual") {
  const url = payment.server_callback_url || merchant.callback_url;
  if (!url) return;

  const body = JSON.stringify(responseParams(payment, merchant, event === "reverse" ? { tran_type: "reverse" } : {}));
  const allowPrivate = process.env.NODE_ENV !== "production" || process.env.ALLOW_PRIVATE_CALLBACKS === "1";

  if (!allowPrivate && isPrivateUrl(url)) {
    await logCallback(
      payment.id,
      url,
      event,
      body,
      null,
      "",
      "Skipped: this URL points to localhost or a private network. The gateway lives on the internet and cannot reach your computer. Deploy your backend or use a tunnel (ngrok, cloudflared) to get a public URL.",
      0,
    );
    return;
  }

  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "StepPay-Callback/1.0" },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(6000),
    });
    const text = (await res.text().catch(() => "")).slice(0, 2000);
    const ok = res.status >= 200 && res.status < 300;
    await logCallback(
      payment.id,
      url,
      event,
      body,
      res.status,
      text,
      ok ? "" : `Your server answered HTTP ${res.status}. Return 200 OK when the callback is processed.`,
      Date.now() - started,
    );
    if (!ok) await callbackFailedNotice(payment, merchant);
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "TimeoutError"
        ? "Timeout: your server did not answer within 6 seconds."
        : `Could not connect: ${err instanceof Error ? (err.cause as Error)?.message || err.message : String(err)}`;
    await logCallback(payment.id, url, event, body, null, "", msg, Date.now() - started);
    await callbackFailedNotice(payment, merchant);
  }
}

async function logCallback(
  paymentRef: number,
  url: string,
  event: string,
  body: string,
  status: number | null,
  response: string,
  error: string,
  ms: number,
) {
  await sql(
    `INSERT INTO callbacks (payment_ref, url, event, request_body, http_status, response_body, error, duration_ms)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [paymentRef, url, event, body, status, response, error, ms],
  );
}

async function callbackFailedNotice(payment: Payment, merchant: Merchant) {
  // One notification per merchant per hour is enough.
  const recent = await sqlOne(
    `SELECT 1 FROM notifications WHERE user_id = $1 AND title = 'Callback failed' AND created_at > now() - interval '1 hour'`,
    [merchant.user_id],
  );
  if (recent) return;
  await notify(merchant.user_id, {
    kind: "danger",
    title: "Callback failed",
    body: `We could not deliver the server callback for order ${payment.order_id}. Open the log to see why.`,
    link: "/portal/logs?tab=callbacks",
  });
}
