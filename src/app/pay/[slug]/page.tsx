import { notFound } from "next/navigation";
import { sqlOne } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { CheckoutFrame } from "@/app/checkout/frame";
import { PayLinkForm } from "./PayLinkForm";

export const metadata = { title: "Pay", robots: { index: false } };

export default async function PayLinkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await sqlOne(
    `SELECT l.*, m.name AS merchant_name, m.url AS merchant_url, m.active AS merchant_active
       FROM payment_links l JOIN merchants m ON m.id = l.merchant_ref WHERE l.slug = $1`,
    [slug],
  );
  if (!link) notFound();
  const usable = link.active && link.merchant_active;

  return (
    <CheckoutFrame merchant={{ name: link.merchant_name, url: link.merchant_url }} embed={false}>
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="text-[13px] font-semibold text-ink-3">{link.merchant_name}</div>
        <h1 className="mt-1 text-[24px] font-extrabold tracking-tight">{link.title}</h1>
        {link.description && <p className="mt-1 text-[15px] text-ink-2">{link.description}</p>}
        {link.amount && <div className="mt-5 text-[40px] font-extrabold tracking-tight">{formatMoney(link.amount, link.currency)}</div>}
        {usable ? (
          <PayLinkForm slug={slug} openAmount={!link.amount} currency={link.currency} />
        ) : (
          <p className="mt-6 rounded-xl bg-[#eef0ef] px-4 py-3 text-[14px] text-ink-2">This payment link is not active anymore.</p>
        )}
      </div>
    </CheckoutFrame>
  );
}
