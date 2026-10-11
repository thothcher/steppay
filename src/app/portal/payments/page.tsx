import Link from "next/link";
import { CreditCard, Download, FlaskConical } from "lucide-react";
import { getScope, qs, sp } from "@/lib/portal";
import { readRange, fmtDate, fmtTime } from "@/lib/dates";
import { expireStale } from "@/lib/gateway";
import { listPayments, PAYMENT_TABS, tabCounts } from "@/lib/queries";
import { minorToMajor } from "@/lib/money";
import { ButtonLink, Card, EmptyState, PageHeader, Pagination, StatusBadge, Table, Tabs, Td, Th, Badge } from "@/components/ui";
import { FilterBar } from "@/components/portal/FilterBar";
import { CardBrand } from "@/components/portal/CardBrand";

export const metadata = { title: "Payments" };

const STATUS_OPTIONS = [
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "created", label: "Created" },
  { value: "processing", label: "Processing" },
  { value: "expired", label: "Expired" },
  { value: "reversed", label: "Reversed" },
];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { user, merchantRef } = await getScope();
  await expireStale();

  const { from, to } = readRange({ from: sp(params, "from"), to: sp(params, "to") }, 30);
  const tab = PAYMENT_TABS.some((t) => t.key === sp(params, "tab")) ? sp(params, "tab") : "all";
  const status = STATUS_OPTIONS.some((s) => s.value === sp(params, "status")) ? sp(params, "status") : "";
  const q = sp(params, "q").trim().slice(0, 100);
  const page = Math.max(1, Number(sp(params, "page")) || 1);
  const filters = { userId: user.id, merchantRef, from, to, tab, status, q };

  const [{ total, rows }, counts] = await Promise.all([listPayments(filters, page), tabCounts(filters)]);
  const pages = Math.max(1, Math.ceil(total / 25));
  const keep = { from, to, q, status };

  return (
    <>
      <PageHeader
        title="Payments"
        actions={
          <ButtonLink href={`/api/portal/export${qs({ type: "payments", from, to, tab, status, q })}`} variant="secondary" external>
            <Download className="size-4" /> Export CSV
          </ButtonLink>
        }
      />
      <Tabs
        items={PAYMENT_TABS.map((t) => ({
          label: t.label,
          href: `/portal/payments${qs({ ...keep, tab: t.key === "all" ? "" : t.key })}`,
          active: tab === t.key,
          count: t.key === "all" ? undefined : counts?.[t.key as "uncaptured" | "refunds" | "declined"],
        }))}
      />

      <Card className="p-4 sm:p-5">
        <FilterBar
          basePath="/portal/payments"
          from={from}
          to={to}
          keep={tab !== "all" ? { tab } : {}}
          search={q}
          status={status}
          statusOptions={STATUS_OPTIONS}
        />

        {rows.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={q || status || tab !== "all" ? "No payments match these filters" : "No payments in this period"}
            description="Create a test payment from your website, or use the API playground to make one in a few clicks."
            action={
              <ButtonLink href="/portal/playground">
                <FlaskConical className="size-4" /> Open API playground
              </ButtonLink>
            }
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Order start time</Th>
                  <Th>Payment system</Th>
                  <Th>Payment amount</Th>
                  <Th>Customer email</Th>
                  <Th>Payment ID</Th>
                  <Th>Status name</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const href = `/portal/payments/${p.payment_id}`;
                  return (
                    <tr key={p.payment_id} className="group relative hover:bg-[#fafbfa]">
                      <Td>
                        <Link href={href} className="block after:absolute after:inset-0">
                          <div className="font-medium text-ink">{fmtDate(p.created_at)}</div>
                          <div className="text-[13px] text-ink-3 tnum">{fmtTime(p.created_at)}</div>
                        </Link>
                      </Td>
                      <Td>{p.card_type ? <CardBrand type={p.card_type} last4={p.masked_card.slice(-4)} /> : <CardBrand type="" />}</Td>
                      <Td>
                        <span className="inline-flex items-center overflow-hidden rounded-lg ring-1 ring-line">
                          <span className="bg-[#eef1ef] px-2 py-1 text-[12.5px] font-semibold text-ink-2">{p.currency}</span>
                          <span className="px-2 py-1 text-[14px] font-bold tnum">{minorToMajor(p.amount)}</span>
                        </span>
                        {p.reversal_amount > 0 && <div className="mt-1 text-[12px] text-[#5a3cc0]">−{minorToMajor(p.reversal_amount)} refunded</div>}
                      </Td>
                      <Td className="max-w-[220px] truncate text-ink-2">{p.sender_email || <span className="text-ink-3">—</span>}</Td>
                      <Td>
                        <div className="font-mono text-[13.5px] text-ink tnum">{p.payment_id}</div>
                        <div className="max-w-[260px] truncate text-[13px] text-ink-3">{p.order_id}</div>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="blue">Test</Badge>
                          <StatusBadge status={p.status} />
                          {p.preauth && !p.captured && p.status === "approved" && <Badge tone="amber">Uncaptured</Badge>}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={page} pages={pages} makeHref={(n) => `/portal/payments${qs({ ...keep, tab: tab === "all" ? "" : tab, page: n })}`} />
          </>
        )}
      </Card>
      <p className="mt-3 text-[12.5px] text-ink-3">
        {total} payment{total === 1 ? "" : "s"} found · Dates are shown in Tbilisi time.
      </p>
    </>
  );
}
