import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { merchantByRef, paymentByToken } from "@/lib/gateway";
import { TEST_CARDS } from "@/lib/testcards";
import { formatMoney } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { CheckoutFrame } from "../frame";
import { CheckoutForm } from "../CheckoutForm";
import { buttonClass } from "@/components/ui";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { token } = await params;
  const embed = (await searchParams).embed === "1";
  const payment = await paymentByToken(token);
  if (!payment) notFound();
  const q = embed ? "?embed=1" : "";
  if (payment.status === "processing") redirect(`/checkout/${token}/3ds${q}`);
  if (["approved", "declined", "reversed"].includes(payment.status)) redirect(`/checkout/${token}/result${q}`);

  const merchant = (await merchantByRef(payment.merchant_ref))!;
  const amount = formatMoney(payment.amount, payment.currency);

  if (payment.status === "expired") {
    return (
      <CheckoutFrame merchant={merchant} embed={embed}>
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#eef0ef] text-ink-3">
            <Clock className="size-7" />
          </div>
          <h1 className="mt-4 text-[22px] font-extrabold">This payment link has expired</h1>
          <p className="mt-2 text-[14.5px] text-ink-2">Go back to the store and start the checkout again.</p>
          {payment.response_url && !embed && (
            <a href={payment.response_url} className={buttonClass("primary", "lg", "mt-6 w-full")}>
              Return to {merchant.name}
            </a>
          )}
        </div>
      </CheckoutFrame>
    );
  }

  return (
    <CheckoutFrame merchant={merchant} embed={embed}>
      <div className={embed ? "space-y-5" : "grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_440px] lg:gap-12"}>
        {/* Order summary */}
        <section className={embed ? "rounded-2xl bg-canvas p-4" : "lg:sticky lg:top-8"}>
          <div className="text-[13px] font-semibold text-ink-3">Pay {merchant.name}</div>
          <div className={embed ? "mt-1 text-[30px] font-extrabold tracking-tight" : "mt-1 text-[44px] font-extrabold leading-tight tracking-tight"}>
            {amount}
          </div>
          <p className="mt-2 text-[15px] text-ink-2">{payment.order_desc}</p>
          {!embed && (
            <dl className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white text-[14px]">
              <Row k="Order" v={<span className="font-mono text-[13px]">{payment.order_id}</span>} />
              <Row k="Merchant" v={merchant.name} />
              <Row k="Valid until" v={fmtDateTime(payment.expires_at)} />
              <Row k="Total" v={<b className="text-ink">{amount}</b>} />
            </dl>
          )}
          {!embed && (
            <p className="mt-5 text-[12.5px] leading-relaxed text-ink-3">
              This is a sandbox checkout made for learning. Card data is never stored — only the masked number (like 424242XXXXXX4242) is saved.
            </p>
          )}
        </section>

        <section className={embed ? "" : "rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"}>
          <CheckoutForm
            token={token}
            embed={embed}
            amountLabel={amount}
            email={payment.sender_email}
            testCards={TEST_CARDS.map((c) => ({ number: c.number, brand: c.brand, label: c.label, result: c.result }))}
          />
        </section>
      </div>
    </CheckoutFrame>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-ink-3">{k}</dt>
      <dd className="min-w-0 truncate text-right text-ink-2">{v}</dd>
    </div>
  );
}
