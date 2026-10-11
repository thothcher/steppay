import Link from "next/link";
import { Download, Landmark } from "lucide-react";
import { getScope, qs, sp } from "@/lib/portal";
import { fmtDate, isoDay, readRange } from "@/lib/dates";
import { settlementRows } from "@/lib/stats";
import { formatMoney } from "@/lib/money";
import { ButtonLink, Callout, Card, EmptyState, PageHeader, StatusBadge, Table, Td, Th } from "@/components/ui";
import { FilterBar } from "@/components/portal/FilterBar";

export const metadata = { title: "Settlements" };

export default async function SettlementsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { user, merchantRef, merchants } = await getScope();
  const { from, to } = readRange({ from: sp(params, "from"), to: sp(params, "to") }, 30);
  const rows = await settlementRows({ userId: user.id, merchantRef }, from, to);
  const today = isoDay();
  const notActivated = merchants.some((m) => m.company_status !== "activated");

  const totals = new Map<string, { net: number; fees: number; n: number }>();
  for (const r of rows) {
    if (!r.activated || r.day > today) continue;
    const t = totals.get(r.currency) ?? { net: 0, fees: 0, n: 0 };
    t.net += r.net;
    t.fees += r.fees;
    t.n += r.n;
    totals.set(r.currency, t);
  }

  return (
    <>
      <PageHeader
        title="Settlements"
        description="Every day StepPay pays the previous day’s approved payments to your IBAN — minus refunds and a 2% fee (T+1)."
        actions={
          <ButtonLink href={`/api/portal/export${qs({ type: "settlements", from, to })}`} variant="secondary" external>
            <Download className="size-4" /> Export CSV
          </ButtonLink>
        }
      />
      {notActivated && (
        <Callout tone="warning" title="Some merchants are not activated" className="mb-6">
          Their money is <b>on hold</b> until you finish <Link href="/portal/activation">activation</Link> (director + IBAN).
        </Callout>
      )}

      {totals.size > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...totals.entries()].map(([cur, t]) => (
            <Card key={cur} className="p-5">
              <div className="text-[13px] font-semibold text-ink-3">Settled in {cur}</div>
              <div className="mt-1 text-[28px] font-extrabold tracking-tight">{formatMoney(t.net, cur)}</div>
              <div className="text-[13px] text-ink-3">
                {t.n} payments · fees {formatMoney(t.fees, cur)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <FilterBar basePath="/portal/settlements" from={from} to={to} />
        {rows.length === 0 ? (
          <EmptyState icon={Landmark} title="No settlements in this period" description="Approved payments appear here the next day." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Settlement date</Th>
                <Th>Merchant</Th>
                <Th className="text-right">Payments</Th>
                <Th className="text-right">Gross</Th>
                <Th className="text-right">Refunds</Th>
                <Th className="text-right">Fees</Th>
                <Th className="text-right">Net payout</Th>
                <Th>IBAN</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = !r.activated ? "on_hold" : r.day <= today ? "settled" : "scheduled";
                return (
                  <tr key={`${r.day}-${r.merchant_ref}-${r.currency}`}>
                    <Td className="font-medium">{fmtDate(r.day + "T12:00:00Z")}</Td>
                    <Td className="text-ink-2">{r.merchant_name}</Td>
                    <Td className="text-right tnum">{r.n}</Td>
                    <Td className="text-right tnum">{formatMoney(r.gross, r.currency)}</Td>
                    <Td className="text-right tnum text-ink-2">{r.refunds ? `−${formatMoney(r.refunds, r.currency)}` : "—"}</Td>
                    <Td className="text-right tnum text-ink-2">−{formatMoney(r.fees, r.currency)}</Td>
                    <Td className="text-right font-bold tnum">{formatMoney(r.net, r.currency)}</Td>
                    <Td className="font-mono text-[12.5px] text-ink-2">{r.iban ? `${r.iban.slice(0, 4)}…${r.iban.slice(-4)}` : "—"}</Td>
                    <Td>
                      <StatusBadge status={status} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
