import Link from "next/link";
import { ChevronRight, Info, Scale } from "lucide-react";
import { getScope, qs, sp } from "@/lib/portal";
import { readRange, fmtDate } from "@/lib/dates";
import { resolveDisputes } from "@/lib/gateway";
import { sql } from "@/lib/db";
import { TZ } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Card, EmptyState, PageHeader, StatusBadge, Table, Tabs, Td, Th, cn } from "@/components/ui";
import { FilterBar } from "@/components/portal/FilterBar";

export const metadata = { title: "Disputes" };

const TABS = [
  { key: "all", label: "All chargebacks", where: "" },
  { key: "urgent", label: "Urgent", where: "AND d.status = 'needs_response'" },
  { key: "progress", label: "In Progress", where: "AND d.status = 'under_review'" },
  { key: "closed", label: "Closed", where: "AND d.status IN ('won','lost')" },
];

export default async function DisputesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { user, merchantRef } = await getScope();
  await resolveDisputes();
  const { from, to } = readRange({ from: sp(params, "from"), to: sp(params, "to") }, 30);
  const tab = TABS.find((t) => t.key === sp(params, "tab")) ?? TABS[0];
  const q = sp(params, "q").trim();

  const args: unknown[] = [user.id, merchantRef, TZ, from, to];
  let search = "";
  if (q) {
    args.push(`%${q}%`);
    search = `AND (p.order_id ILIKE $6 OR p.payment_id::text ILIKE $6 OR p.order_desc ILIKE $6)`;
  }
  const rows = await sql(
    `SELECT d.*, p.payment_id, p.order_id, p.currency, p.masked_card, m.name AS merchant_name
       FROM disputes d JOIN payments p ON p.id = d.payment_ref JOIN merchants m ON m.id = p.merchant_ref
      WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2)
        AND d.created_at >= ($4::date::timestamp AT TIME ZONE $3) AND d.created_at < (($5::date + 1)::timestamp AT TIME ZONE $3)
        ${tab.where} ${search}
      ORDER BY d.created_at DESC LIMIT 200`,
    args,
  );
  const urgent = await sql<{ n: number }>(
    `SELECT count(*)::int AS n FROM disputes d JOIN payments p ON p.id = d.payment_ref JOIN merchants m ON m.id = p.merchant_ref
      WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2) AND d.status = 'needs_response'`,
    [user.id, merchantRef],
  );

  return (
    <>
      <PageHeader title="Disputes" />
      <details open className="group mb-6 rounded-2xl border border-lime-200 bg-lime-50/70">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
          <Info className="size-5 shrink-0 text-forest-700" />
          <span className="flex-1 text-[16px] font-bold">Dispute process</span>
          <span className="text-[13px] font-semibold text-brand-700 group-open:hidden">Show</span>
          <span className="hidden text-[13px] font-semibold text-brand-700 group-open:inline">Hide</span>
        </summary>
        <div className="px-5 pb-5 pl-[52px] text-[14px] text-ink-2">
          <p>
            A dispute (chargeback) starts when a customer tells their bank they did not get what they paid for. You have <b>7 days</b> to respond. To
            win, provide documents confirming that the goods or services were received:
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            <li>Description of goods/services</li>
            <li>Customer’s registration data and order delivery address</li>
            <li>Document confirming receipt of goods/services by the cardholder (tracking number, signed delivery)</li>
            <li>Confirmation that the customer agreed to the return terms</li>
          </ul>
          <p className="mt-2 text-[13px] text-ink-3">
            Sandbox: pay with card <code className="font-mono">4000 0000 0000 0259</code> to open a dispute. The “bank” reviews evidence after 2
            minutes — detailed evidence (40+ characters) wins.
          </p>
        </div>
      </details>

      <Tabs
        items={TABS.map((t) => ({
          label: t.label,
          href: `/portal/disputes${qs({ tab: t.key === "all" ? "" : t.key, from, to, q })}`,
          active: t.key === tab.key,
          count: t.key === "urgent" ? urgent[0]?.n : undefined,
        }))}
      />

      <Card className="p-4 sm:p-5">
        <FilterBar
          basePath="/portal/disputes"
          from={from}
          to={to}
          keep={tab.key !== "all" ? { tab: tab.key } : {}}
          search={q}
          searchPlaceholder="Search order ID, payment ID or description"
        />
        {rows.length === 0 ? (
          <EmptyState icon={Scale} title="No disputes here" description="Good news — no customer has disputed a payment in this period." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Opened</Th>
                <Th>Payment</Th>
                <Th>Amount</Th>
                <Th>Reason</Th>
                <Th>Respond by</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const daysLeft = Math.ceil((new Date(d.due_at).getTime() - Date.now()) / 86400000);
                return (
                  <tr key={d.id} className="relative hover:bg-[#fafbfa]">
                    <Td>
                      <Link href={`/portal/disputes/${d.id}`} className="font-medium after:absolute after:inset-0">
                        {fmtDate(d.created_at)}
                      </Link>
                    </Td>
                    <Td>
                      <div className="font-mono text-[13.5px]">{d.payment_id}</div>
                      <div className="text-[13px] text-ink-3">{d.order_id}</div>
                    </Td>
                    <Td className="font-semibold tnum">{formatMoney(d.amount, d.currency)}</Td>
                    <Td className="text-ink-2">
                      <span className="mr-1.5 font-mono text-[12.5px] text-ink-3">{d.reason_code}</span>
                      {d.reason}
                    </Td>
                    <Td>
                      {d.status === "needs_response" ? (
                        <span className={cn("font-semibold", daysLeft <= 2 ? "text-red-600" : "text-ink")}>
                          {fmtDate(d.due_at)} · {daysLeft} d left
                        </span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={d.status} />
                    </Td>
                    <Td className="text-right">
                      <ChevronRight className="inline size-4 text-ink-3" />
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
