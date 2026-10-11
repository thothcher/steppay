import { notFound, redirect } from "next/navigation";
import { merchantByRef, paymentByToken, responseParams } from "@/lib/gateway";
import { formatMoney } from "@/lib/money";
import { CheckoutFrame } from "../../frame";
import { ResultView } from "./ResultView";

export const metadata = { title: "Payment result", robots: { index: false } };

export default async function ResultPage({
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
  if (payment.status === "created" || payment.status === "processing") redirect(`/checkout/${token}${embed ? "?embed=1" : ""}`);

  const merchant = (await merchantByRef(payment.merchant_ref))!;
  const data = responseParams(payment, merchant);

  // The customer goes back to the shop with the result in the query string (GET).
  let returnUrl = "";
  if (payment.response_url) {
    try {
      const u = new URL(payment.response_url);
      for (const [k, v] of Object.entries(data)) u.searchParams.set(k, String(v));
      returnUrl = u.toString();
    } catch {}
  }

  return (
    <CheckoutFrame merchant={merchant} embed={embed}>
      <ResultView
        status={payment.status}
        amount={formatMoney(payment.amount, payment.currency)}
        merchantName={merchant.name}
        orderId={payment.order_id}
        paymentId={payment.payment_id}
        card={payment.masked_card}
        reason={payment.response_description}
        returnUrl={returnUrl}
        embed={embed}
        data={data}
      />
    </CheckoutFrame>
  );
}
