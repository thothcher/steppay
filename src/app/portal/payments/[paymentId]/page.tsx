import Link from "next/link";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ownedPayment } from "@/lib/portal";
import { expireStale, merchantByRef, responseParams } from "@/lib/gateway";
import { fmtDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getBaseUrl } from "@/lib/url";
import { Badge, ButtonLink, Card, CardHeader, DefinitionList, StatusBadge, cn } from "@/components/ui";
import { Code, CopyButton } from "@/components/ui/client";
import { CardBrand } from "@/components/portal/CardBrand";
import { CaptureButton, RefundButton, ResendCallbackButton } from "./controls";

export const metadata = { title: "Payment details" };

const SOURCE: Record<string, string> = {
  api: "Server API (signed)",
  sdk: "JavaScript SDK / unsigned",
  link: "Payment link",
  playground: "API playground",
};

export default async function PaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const user = await requireUser();
  await expireStale();
  const p = await ownedPayment(user, Number(paymentId));
  const merchant = (await merchantByRef(p.merchant_ref))!;
  const [refunds, callbacks, disputes] = await Promise.all([
    sql("SELECT * FROM refunds WHERE payment_ref = $1 ORDER BY created_at", [p.id]),
    sql("SELECT * FROM callbacks WHERE payment_ref = $1 ORDER BY created_at DESC LIMIT 20", [p.id]),
    sql("SELECT * FROM disputes WHERE payment_ref = $1 ORDER BY created_at", [p.id]),
  ]);
  const base = await getBaseUrl();
  const checkoutUrl = `${base}/checkout/${p.token}`;
  const available = p.amount - p.reversal_amount;
  const uncaptured = p.preauth && !p.captured && p.status === "approved";
  const payload = responseParams(p, merchant);

  const timeline: { at: Date; title: string; text?: string; tone: string }[] = [
    { at: p.created_at, title: "Order created", text: `via ${SOURCE[p.source] ?? p.source}`, tone: "gray" },
  ];
  if (p.status === "approved" || p.status === "reversed")
    timeline.push({ at: p.paid_at!, title: "Payment approved", text: `${p.card_type} ${p.masked_card}`, tone: "green" });
  if (p.status === "declined")
    timeline.push({ at: p.updated_at, title: "Payment declined", text: `${p.response_code} · ${p.response_description}`, tone: "red" });
  if (p.status === "expired") timeline.push({ at: p.updated_at, title: "Order expired", text: "The customer did not pay in time", tone: "gray" });
  if (p.preauth && p.captured && p.captured_at) timeline.push({ at: p.captured_at, title: "Payment captured", tone: "green" });
  for (const r of refunds)
    timeline.push({
      at: r.created_at,
      title: r.source === "chargeback" ? "Chargeback" : "Refund",
      text: `${formatMoney(r.amount, p.currency)}${r.comment ? ` · ${r.comment}` : ""}`,
      tone: "violet",
    });
  for (const d of disputes) {
    timeline.push({ at: d.created_at, title: "Dispute opened", text: `${d.reason_code} · ${d.reason}`, tone: "amber" });
    if (d.resolved_at) timeline.push({ at: d.resolved_at, title: `Dispute ${d.status}`, tone: d.status === "won" ? "green" : "red" });
  }
  timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const dot: Record<string, string> = { gray: "bg-ink-3", green: "bg-brand-500", red: "bg-red-500", violet: "bg-violet-500", amber: "bg-amber-500" };

  return (
    <>
      <Link href="/portal/payments" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> Payments
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[13px] font-semibold text-ink-3">Payment {p.payment_id}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-[34px] font-extrabold tracking-tight">{formatMoney(p.amount, p.currency)}</h1>
            <Badge tone="blue">Test</Badge>
            <StatusBadge status={p.status} className="text-[13px]" />
            {uncaptured && <Badge tone="amber">Uncaptured</Badge>}
          </div>
          <p className="mt-1 text-[14.5px] text-ink-2">{p.order_desc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.status === "created" && (
            <ButtonLink href={checkoutUrl} external variant="secondary">
              <ExternalLink className="size-4" /> Open checkout
            </ButtonLink>
          )}
          {uncaptured && <CaptureButton paymentId={p.payment_id} />}
          {p.status === "approved" && available > 0 && <RefundButton paymentId={p.payment_id} available={available} currency={p.currency} />}
          {(p.server_callback_url || merchant.callback_url) && ["approved", "declined", "reversed"].includes(p.status) && (
            <ResendCallbackButton paymentId={p.payment_id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Order" />
            <DefinitionList
              items={[
                [
                  "Order ID",
                  <span key="o" className="font-mono text-[13.5px]">
                    {p.order_id}
                  </span>,
                ],
                ["Merchant", `${p.merchant_name} (${p.merchant_public_id})`],
                ["Description", p.order_desc],
                ["Amount", formatMoney(p.amount, p.currency)],
                ["Refunded", p.reversal_amount ? formatMoney(p.reversal_amount, p.currency) : ""],
                ["Created", fmtDateTime(p.created_at)],
                ["Paid", p.paid_at ? fmtDateTime(p.paid_at) : ""],
                ["Link valid until", p.status === "created" ? fmtDateTime(p.expires_at) : ""],
                ["Integration", `${SOURCE[p.source] ?? p.source}${p.signed ? " · signed ✓" : ""}`],
                ["Preauth", p.preauth ? (p.captured ? "Yes — captured" : "Yes — waiting for capture") : "No"],
                [
                  "merchant_data",
                  p.merchant_data && (
                    <span key="md" className="font-mono text-[13px]">
                      {p.merchant_data}
                    </span>
                  ),
                ],
                [
                  "response_url",
                  p.response_url && (
                    <span key="r" className="break-all font-mono text-[13px]">
                      {p.response_url}
                    </span>
                  ),
                ],
                [
                  "server_callback_url",
                  (p.server_callback_url || merchant.callback_url) && (
                    <span key="c" className="break-all font-mono text-[13px]">
                      {p.server_callback_url || merchant.callback_url}
                    </span>
                  ),
                ],
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Callbacks" description="POST requests StepPay sent to your server_callback_url. Your server must answer HTTP 200." />
            {callbacks.length === 0 ? (
              <div className="flex items-start gap-3 px-6 py-5 text-[14px] text-ink-2">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-3" />
                {p.server_callback_url || merchant.callback_url
                  ? "No callbacks yet — they are sent when the payment is approved, declined, refunded or captured."
                  : "This payment has no server_callback_url, so no callback was sent. That's OK for frontend-only projects."}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {callbacks.map((c) => {
                  const ok = c.http_status >= 200 && c.http_status < 300;
                  return (
                    <li key={c.id}>
                      <details className="group px-5 py-3 sm:px-6">
                        <summary className="flex cursor-pointer list-none items-center gap-3">
                          <Badge tone={ok ? "green" : "red"}>{c.http_status ?? "ERR"}</Badge>
                          <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink-2">{c.url}</span>
                          <span className="text-[12.5px] text-ink-3">{c.event}</span>
                          <span className="hidden text-[12.5px] text-ink-3 sm:inline">{fmtDateTime(c.created_at)}</span>
                        </summary>
                        <div className="mt-3 space-y-3">
                          {c.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{c.error}</p>}
                          <Code code={JSON.stringify(JSON.parse(c.request_body), null, 2)} lang="json" title="Request body (JSON)" />
                          {c.response_body && <Code code={c.response_body} lang="text" title={`Your server answered (${c.duration_ms} ms)`} />}
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Response parameters"
              description="Exactly what your site receives on the response_url redirect and in the server callback — including the signature."
            />
            <div className="p-4 sm:p-5">
              <Code code={JSON.stringify(payload, null, 2)} lang="json" title="order status payload" />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Payment method" />
            <div className="px-5 py-4 sm:px-6">
              {p.masked_card ? (
                <div className="flex items-center gap-3">
                  <CardBrand type={p.card_type} />
                  <span className="font-mono text-[14px]">{p.masked_card}</span>
                </div>
              ) : (
                <span className="text-[14px] text-ink-3">No card entered yet</span>
              )}
            </div>
            <DefinitionList
              items={[
                ["Cardholder", p.card_holder],
                ["Customer e-mail", p.sender_email],
                [
                  "RRN",
                  p.rrn && (
                    <span key="rrn" className="font-mono">
                      {p.rrn}
                    </span>
                  ),
                ],
                [
                  "Approval code",
                  p.approval_code && (
                    <span key="ac" className="font-mono">
                      {p.approval_code}
                    </span>
                  ),
                ],
                ["Response", p.response_code ? `${p.response_code} · ${p.response_description}` : p.response_description],
              ]}
            />
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <ol className="px-5 py-4 sm:px-6">
              {timeline.map((t, i) => (
                <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < timeline.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-line" />}
                  <span className={cn("relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white", dot[t.tone])} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink">{t.title}</div>
                    {t.text && <div className="text-[13px] text-ink-2">{t.text}</div>}
                    <div className="text-[12px] text-ink-3">{fmtDateTime(t.at)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {p.status === "created" && (
            <Card className="p-5">
              <div className="text-[14px] font-bold">Checkout link</div>
              <p className="mt-1 text-[13px] text-ink-2">Send it to the customer or open it yourself to pay with a test card.</p>
              <div className="mt-3 flex items-center gap-1 rounded-xl border border-line-strong bg-[#f8faf8] py-1 pl-3 pr-1">
                <code className="min-w-0 flex-1 truncate font-mono text-[12.5px]">{checkoutUrl}</code>
                <CopyButton value={checkoutUrl} label="Copy" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
