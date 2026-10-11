import Link from "next/link";
import { ArrowRight, Code, Info, Rocket, RefreshCw, Store } from "lucide-react";
import { getScope, sp } from "@/lib/portal";
import { readRange, fmtDateTime, fmtDate, fmtTime } from "@/lib/dates";
import { breakdowns, dailySales, dailySettlements, settlementSummary, summary } from "@/lib/stats";
import { expireStale, resolveDisputes } from "@/lib/gateway";
import { formatMoney } from "@/lib/money";
import { sql } from "@/lib/db";
import { CURRENCIES } from "@/lib/brand";
import { ButtonLink, Card, PageHeader, StatusBadge, cn } from "@/components/ui";
import { FilterBar } from "@/components/portal/FilterBar";
import { AreaChart } from "@/components/charts/AreaChart";
import { BarList } from "@/components/charts/BarList";
import { CardBrand } from "@/components/portal/CardBrand";

export const metadata = { title: "Home" };

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  created: "Created (not paid yet)",
  processing: "Processing (3-D Secure)",
  reversed: "Reversed",
};
const SOURCE_LABEL: Record<string, string> = {
  api: "Server API (signed)",
  sdk: "JavaScript SDK",
  link: "Payment link",
  playground: "API playground",
};

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { user, merchants, merchantRef, selected } = await getScope();
  await Promise.all([expireStale(), resolveDisputes()]);

  if (merchants.length === 0) return <Welcome name={user.full_name.split(" ")[0]} />;

  const { from, to } = readRange({ from: sp(params, "from"), to: sp(params, "to") }, 7);
  const currencyParam = sp(params, "currency").toUpperCase();
  const currency = (CURRENCIES as readonly string[]).includes(currencyParam) ? currencyParam : "GEL";
  const scope = { userId: user.id, merchantRef };

  const [sales, settlements, sum, settle, br, recent] = await Promise.all([
    dailySales(scope, from, to, currency),
    dailySettlements(scope, from, to, currency),
    summary(scope, from, to, currency),
    settlementSummary(scope, from, to, currency),
    breakdowns(scope, from, to),
    sql(
      `SELECT p.payment_id, p.order_id, p.amount, p.currency, p.status, p.card_type, p.masked_card, p.created_at, m.name AS merchant_name
         FROM payments p JOIN merchants m ON m.id = p.merchant_ref
        WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2)
        ORDER BY p.created_at DESC LIMIT 6`,
      [user.id, merchantRef],
    ),
  ]);
  const totalSettled = settlements.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <PageHeader
        title="Category Overview"
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3">
            Last updated {fmtDateTime(new Date())}
            <Link
              href={`/portal/home?from=${from}&to=${to}&currency=${currency}`}
              className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
            >
              <RefreshCw className="size-3.5" /> Update
            </Link>
          </span>
        }
        eyebrow={selected ? `Merchant: ${selected.name}` : `All merchants (${merchants.length})`}
      />
      <FilterBar basePath="/portal/home" from={from} to={to} currency={currency} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="px-5 pt-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-ink">
              Total Sales
              <span title="Sum of approved payments by the day they were paid." className="text-ink-3">
                <Info className="size-4" />
              </span>
            </h2>
            <div className="mt-1 text-[34px] font-extrabold tracking-tight text-ink">{formatMoney(sum.sales, currency)}</div>
            <div className="text-[13px] text-ink-3">{sum.sales_n} approved payments</div>
          </div>
          <div className="px-3 pb-2 pt-4 sm:px-4">
            <AreaChart data={sales} currency={currency} label="Total sales" />
          </div>
          <div className="grid grid-cols-3 border-t border-line">
            <Stat
              label="Refunds"
              value={sum.refunds_n ? formatMoney(sum.refunds, currency) : "—"}
              sub={`${sum.refunds_n} refunds`}
              href="/portal/payments?tab=refunds"
            />
            <Stat label="Decline" value={String(sum.declined_n)} sub="Transactions" href="/portal/payments?tab=declined" />
            <Stat
              label="Conversion"
              value={sum.conversion === null ? "—" : `${sum.conversion}%`}
              sub="Approved / finished"
              title="Approved payments divided by all finished payments (approved, declined, expired) created in this period."
            />
          </div>
        </Card>

        <Card>
          <div className="px-5 pt-5 sm:px-6">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-ink">
              Total Settlements
              <span title="Money paid out to your IBAN: approved payments minus refunds and fees, the next day (T+1)." className="text-ink-3">
                <Info className="size-4" />
              </span>
            </h2>
            <div className="mt-1 text-[34px] font-extrabold tracking-tight text-ink">{formatMoney(totalSettled, currency)}</div>
            <div className="text-[13px] text-ink-3">Paid out to your bank account</div>
          </div>
          <div className="px-3 pb-2 pt-4 sm:px-4">
            <AreaChart data={settlements} currency={currency} label="Total settlements" countLabel="payments settled" />
          </div>
          <div className="grid grid-cols-3 border-t border-line">
            <Stat label="Settled payments" value={String(settle.settled_n)} sub="Details" href="/portal/settlements" />
            <Stat
              label="Not settled"
              value={formatMoney(settle.scheduled + settle.on_hold, currency)}
              sub={settle.on_hold > 0 ? "Activation required" : "Scheduled"}
            />
            <Stat label="StepPay fees" value={formatMoney(settle.fees, currency)} sub="2% per payment" />
          </div>
        </Card>
      </div>

      <h2 className="mb-4 mt-10 text-[24px] font-extrabold tracking-tight text-ink">Payments analytics</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 text-[15px] font-bold">Payments by status</h3>
          <BarList items={br.statuses.map((s) => ({ label: STATUS_LABEL[s.key] ?? s.key, value: s.n }))} />
        </Card>
        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 text-[15px] font-bold">Card brands</h3>
          <BarList items={br.cards.map((s) => ({ label: s.key === "MASTERCARD" ? "Mastercard" : s.key === "VISA" ? "Visa" : s.key, value: s.n }))} />
        </Card>
        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 text-[15px] font-bold">Integration type</h3>
          <BarList items={br.sources.map((s) => ({ label: SOURCE_LABEL[s.key] ?? s.key, value: s.n }))} />
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h3 className="text-[15px] font-bold">Recent payments</h3>
          <Link href="/portal/payments" className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand-700 hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-ink-3">
            No payments yet. Make a test payment in the{" "}
            <Link href="/portal/playground" className="font-semibold text-brand-700 underline">
              API playground
            </Link>
            .
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((p) => (
              <li key={p.payment_id}>
                <Link href={`/portal/payments/${p.payment_id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-[#fafbfa] sm:px-6">
                  <CardBrand type={p.card_type} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-ink">{p.order_id}</div>
                    <div className="truncate text-[12.5px] text-ink-3">
                      {p.merchant_name} · {fmtDate(p.created_at)} {fmtTime(p.created_at)}
                    </div>
                  </div>
                  <div className="text-right text-[14px] font-bold tnum">{formatMoney(p.amount, p.currency)}</div>
                  <StatusBadge status={p.status} className="hidden sm:inline-flex" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value, sub, href, title }: { label: string; value: string; sub: string; href?: string; title?: string }) {
  const inner = (
    <>
      <div className="text-[13px] font-semibold text-ink">{label}</div>
      <div className="mt-1 truncate text-[17px] font-bold text-ink">{value}</div>
      <div className={cn("mt-0.5 text-[12.5px]", href ? "text-brand-700" : "text-ink-3")}>{sub}</div>
    </>
  );
  const cls = "block min-w-0 border-r border-line px-4 py-4 last:border-r-0 sm:px-6";
  return href ? (
    <Link href={href} className={cn(cls, "hover:bg-[#fafbfa]")} title={title}>
      {inner}
    </Link>
  ) : (
    <div className={cls} title={title}>
      {inner}
    </div>
  );
}

function Welcome({ name }: { name: string }) {
  const steps = [
    {
      icon: Store,
      title: "Create your merchant",
      text: "Tell us about your shop. You get a merchant ID and secret key instantly.",
      href: "/portal/activation",
      cta: "Start activation",
    },
    {
      icon: Code,
      title: "Add payments to your site",
      text: "Copy the ready code for plain HTML, Node.js, PHP or Python.",
      href: "/docs/quick-start",
      cta: "Read the guide",
    },
    {
      icon: Rocket,
      title: "Pay with a test card",
      text: "Use 4242 4242 4242 4242 and watch the order appear here.",
      href: "/docs/test-cards",
      cta: "See test cards",
    },
  ];
  return (
    <div className="animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-lime-300/20 blur-3xl" />
        <p className="text-[14px] font-semibold text-lime-300">Welcome, {name} 👋</p>
        <h1 className="mt-2 max-w-2xl text-[32px] font-extrabold leading-tight tracking-tight sm:text-[38px]">
          Let’s connect payments to your project in three steps.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-white/70">
          Everything here works like a real payment provider — merchant keys, signatures, a hosted checkout and callbacks — only with test money.
        </p>
        <ButtonLink href="/portal/activation" variant="lime" size="lg" className="mt-6">
          Create my merchant <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={s.title} className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-lime-100 text-forest-800">
                <s.icon className="size-5" />
              </span>
              <span className="text-[13px] font-bold text-ink-3">STEP {i + 1}</span>
            </div>
            <h3 className="mt-4 text-[17px] font-bold">{s.title}</h3>
            <p className="mt-1 text-[14px] text-ink-2">{s.text}</p>
            <Link href={s.href} className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-brand-700 hover:underline">
              {s.cta} <ArrowRight className="size-4" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
