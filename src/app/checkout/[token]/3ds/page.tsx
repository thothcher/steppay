import { notFound, redirect } from "next/navigation";
import { merchantByRef, paymentByToken } from "@/lib/gateway";
import { formatMoney } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { BRAND } from "@/lib/brand";
import { CheckoutFrame } from "../../frame";
import { ThreeDSForm } from "./ThreeDSForm";

export const metadata = { title: "3-D Secure", robots: { index: false } };

export default async function ThreeDSPage({
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
  if (payment.status !== "processing" || !payment.pending)
    redirect(`/checkout/${token}${payment.status === "created" ? "" : "/result"}${embed ? "?embed=1" : ""}`);
  const merchant = (await merchantByRef(payment.merchant_ref))!;

  return (
    <CheckoutFrame merchant={merchant} embed={embed}>
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between bg-[#1d2b6b] px-6 py-4 text-white">
          <div>
            <div className="text-[17px] font-extrabold tracking-tight">{BRAND.bankName}</div>
            <div className="text-[11.5px] text-white/70">SecureCode · 3-D Secure verification</div>
          </div>
          <span className="rounded-md bg-white px-2 py-1 text-[11px] font-black italic text-[#1a1f71]">
            {payment.pending.outcome.brand === "VISA" ? "VISA Secure" : "ID Check"}
          </span>
        </div>
        <div className="p-6">
          <p className="text-[14.5px] text-ink-2">
            Your bank wants to confirm it’s really you. We sent a one-time code by SMS to <b className="text-ink">+995 5•• •• •• 42</b>.
          </p>
          <dl className="my-5 space-y-1.5 rounded-2xl bg-canvas p-4 text-[13.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Merchant</dt>
              <dd className="truncate font-semibold">{merchant.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Amount</dt>
              <dd className="font-semibold">{formatMoney(payment.amount, payment.currency)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Date</dt>
              <dd>{fmtDateTime(new Date())}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">Card</dt>
              <dd className="font-mono">{payment.pending.masked}</dd>
            </div>
          </dl>
          <ThreeDSForm token={token} embed={embed} />
        </div>
      </div>
    </CheckoutFrame>
  );
}
