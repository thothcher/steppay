import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { sql, sqlOne } from "@/lib/db";
import { merchantStatus, type MerchantRow } from "@/lib/portal";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Badge, Card, CardHeader, DefinitionList, PageHeader, StatusBadge, Table, Td, Th } from "@/components/ui";
import { AdminControls } from "./controls";

export const metadata = { title: "Student" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const u = await sqlOne("SELECT * FROM users WHERE id = $1", [Number(id)]);
  if (!u) notFound();
  const [merchants, payments] = await Promise.all([
    sql<MerchantRow & { payments: number }>(
      `SELECT m.*, c.name AS company_name, c.status AS company_status,
              (SELECT count(*) FROM payments p WHERE p.merchant_ref = m.id)::int AS payments
         FROM merchants m LEFT JOIN companies c ON c.id = m.company_id WHERE m.user_id = $1 ORDER BY m.created_at`,
      [u.id],
    ),
    sql(
      `SELECT p.payment_id, p.order_id, p.amount, p.currency, p.status, p.source, p.created_at, m.name AS merchant_name
         FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE m.user_id = $1 ORDER BY p.created_at DESC LIMIT 50`,
      [u.id],
    ),
  ]);

  return (
    <>
      <Link href="/portal/admin" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> Lecturer panel
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {u.full_name} {u.role === "admin" && <Badge tone="lime">Lecturer</Badge>}
          </span>
        }
        description={`${u.email}${u.group_name ? ` · group ${u.group_name}` : ""}`}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title={`Merchants (${merchants.length})`} />
            {merchants.length === 0 ? (
              <div className="px-6 py-8 text-[14px] text-ink-3">This student has not created a merchant yet.</div>
            ) : (
              <Table className="px-2 pb-2">
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Merchant ID</Th>
                    <Th>URL</Th>
                    <Th className="text-right">Payments</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((m) => (
                    <tr key={m.id}>
                      <Td className="font-semibold">
                        <Link href={`/portal/merchants/${m.id}`} className="hover:text-brand-700">
                          {m.name}
                        </Link>
                      </Td>
                      <Td className="font-mono text-[13px]">{m.merchant_id}</Td>
                      <Td className="max-w-[240px] truncate text-ink-2">{m.url || "—"}</Td>
                      <Td className="text-right tnum">{m.payments}</Td>
                      <Td>
                        <StatusBadge status={merchantStatus(m)} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
          <Card>
            <CardHeader title="Latest payments" />
            {payments.length === 0 ? (
              <div className="px-6 py-8 text-[14px] text-ink-3">No payments yet.</div>
            ) : (
              <Table className="px-2 pb-2">
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>Merchant</Th>
                    <Th>Order</Th>
                    <Th>Integration</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.payment_id} className="relative hover:bg-[#fafbfa]">
                      <Td className="text-ink-2 tnum">
                        <Link href={`/portal/payments/${p.payment_id}`} className="after:absolute after:inset-0">
                          {fmtDate(p.created_at)} {fmtTime(p.created_at)}
                        </Link>
                      </Td>
                      <Td className="text-ink-2">{p.merchant_name}</Td>
                      <Td className="max-w-[200px] truncate font-mono text-[13px]">{p.order_id}</Td>
                      <Td className="text-ink-2">{p.source}</Td>
                      <Td className="text-right font-semibold tnum">{formatMoney(p.amount, p.currency)}</Td>
                      <Td>
                        <StatusBadge status={p.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" />
            <DefinitionList
              items={[
                ["Joined", fmtDate(u.created_at)],
                ["Last sign in", u.last_login_at ? fmtDateTime(u.last_login_at) : "never"],
                ["Role", u.role === "admin" ? "Lecturer" : "Student"],
              ]}
            />
          </Card>
          <Card className="p-5">
            <AdminControls userId={u.id} role={u.role} isSelf={u.id === admin.id} />
          </Card>
        </div>
      </div>
    </>
  );
}
