import Link from "next/link";
import { ChevronRight, GraduationCap, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { sql, sqlOne } from "@/lib/db";
import { expireStale } from "@/lib/gateway";
import { qs, sp } from "@/lib/portal";
import { fmtDate, fmtTime, timeAgo, TZ } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, StatusBadge, Table, Td, Th } from "@/components/ui";

export const metadata = { title: "Lecturer panel" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin();
  await expireStale();
  const params = await searchParams;
  const q = sp(params, "q").trim();
  const group = sp(params, "group");

  const [kpi, groups, students, recent] = await Promise.all([
    sqlOne<{ students: number; merchants: number; payments_today: number; approved_today: number; volume: number }>(
      `SELECT (SELECT count(*) FROM users WHERE role = 'student')::int AS students,
              (SELECT count(*) FROM merchants)::int AS merchants,
              (SELECT count(*) FROM payments WHERE (created_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date)::int AS payments_today,
              (SELECT count(*) FROM payments WHERE status IN ('approved','reversed') AND (paid_at AT TIME ZONE $1)::date = (now() AT TIME ZONE $1)::date)::int AS approved_today,
              (SELECT COALESCE(sum(amount), 0) FROM payments WHERE status IN ('approved','reversed') AND currency = 'GEL')::float8 AS volume`,
      [TZ],
    ),
    sql<{ group_name: string; n: number }>("SELECT group_name, count(*)::int AS n FROM users WHERE group_name <> '' GROUP BY 1 ORDER BY 1"),
    sql(
      `SELECT u.id, u.full_name, u.email, u.group_name, u.role, u.created_at, u.last_login_at,
              (SELECT count(*) FROM merchants m WHERE m.user_id = u.id)::int AS merchants,
              (SELECT count(*) FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE m.user_id = u.id)::int AS payments,
              (SELECT count(*) FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE m.user_id = u.id AND p.status IN ('approved','reversed'))::int AS approved,
              (SELECT COALESCE(sum(p.amount), 0) FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE m.user_id = u.id AND p.status IN ('approved','reversed') AND p.currency = 'GEL')::float8 AS volume,
              (SELECT max(p.created_at) FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE m.user_id = u.id) AS last_payment,
              (SELECT bool_or(c.status = 'activated') FROM companies c WHERE c.user_id = u.id) AS activated
         FROM users u
        WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
          AND ($2 = '' OR u.group_name = $2)
        ORDER BY u.group_name, u.full_name
        LIMIT 500`,
      [q, group],
    ),
    sql(
      `SELECT p.payment_id, p.order_id, p.amount, p.currency, p.status, p.created_at, m.name AS merchant_name, u.full_name, u.group_name
         FROM payments p JOIN merchants m ON m.id = p.merchant_ref JOIN users u ON u.id = m.user_id
        ORDER BY p.created_at DESC LIMIT 15`,
    ),
  ]);

  const tiles = [
    { label: "Students", value: kpi?.students ?? 0 },
    { label: "Merchants", value: kpi?.merchants ?? 0 },
    { label: "Payments today", value: kpi?.payments_today ?? 0, sub: `${kpi?.approved_today ?? 0} approved` },
    { label: "Approved volume (GEL, all time)", value: formatMoney(kpi?.volume ?? 0, "GEL") },
  ];

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-4" /> Lecturer panel
          </span>
        }
        title="Academy overview"
        description="Every student, their merchants and payments. Click a student to reset a password or see their orders."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <div className="text-[13px] font-semibold text-ink-3">{t.label}</div>
            <div className="mt-1 text-[28px] font-extrabold tracking-tight">{t.value}</div>
            {t.sub && <div className="text-[12.5px] text-ink-3">{t.sub}</div>}
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-5">
        <form className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input name="q" defaultValue={q} placeholder="Search student by name or e-mail" className="pl-10" />
          </div>
          <Select name="group" defaultValue={group} className="sm:w-56" aria-label="Group">
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.group_name} value={g.group_name}>
                {g.group_name} ({g.n})
              </option>
            ))}
          </Select>
          <Button type="submit">Filter</Button>
        </form>
        {students.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" description="Students appear here after they register." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Group</Th>
                <Th>Activation</Th>
                <Th className="text-right">Merchants</Th>
                <Th className="text-right">Payments</Th>
                <Th className="text-right">Approved (GEL)</Th>
                <Th>Last payment</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="relative hover:bg-[#fafbfa]">
                  <Td>
                    <Link href={`/portal/admin/users/${s.id}`} className="font-semibold after:absolute after:inset-0 hover:text-brand-700">
                      {s.full_name}
                    </Link>
                    <div className="text-[12.5px] text-ink-3">
                      {s.email}{" "}
                      {s.role === "admin" && (
                        <Badge tone="lime" className="ml-1">
                          Lecturer
                        </Badge>
                      )}
                    </div>
                  </Td>
                  <Td className="text-ink-2">{s.group_name || "—"}</Td>
                  <Td>
                    {s.merchants === 0 ? <Badge tone="gray">Not started</Badge> : <StatusBadge status={s.activated ? "activated" : "pending"} />}
                  </Td>
                  <Td className="text-right tnum">{s.merchants}</Td>
                  <Td className="text-right tnum">
                    {s.approved} / {s.payments}
                  </Td>
                  <Td className="text-right font-semibold tnum">{formatMoney(s.volume, "GEL")}</Td>
                  <Td className="text-ink-2">{s.last_payment ? timeAgo(s.last_payment) : "—"}</Td>
                  <Td className="text-right">
                    <ChevronRight className="inline size-4 text-ink-3" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Latest payments across the academy" />
        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-[14px] text-ink-3">No payments yet.</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Student</Th>
                <Th>Merchant</Th>
                <Th>Order</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.payment_id} className="relative hover:bg-[#fafbfa]">
                  <Td className="text-ink-2 tnum">
                    <Link href={`/portal/payments/${p.payment_id}`} className="after:absolute after:inset-0">
                      {fmtDate(p.created_at)} {fmtTime(p.created_at)}
                    </Link>
                  </Td>
                  <Td>
                    {p.full_name} <span className="text-[12.5px] text-ink-3">{p.group_name}</span>
                  </Td>
                  <Td className="text-ink-2">{p.merchant_name}</Td>
                  <Td className="max-w-[200px] truncate font-mono text-[13px]">{p.order_id}</Td>
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
      <p className="mt-3 text-[12.5px] text-ink-3">
        Tip: add lecturer e-mails to the <code className="font-mono">ADMIN_EMAILS</code> environment variable.{" "}
        <Link href={`/portal/admin${qs({})}`} className="underline">
          Refresh
        </Link>
      </p>
    </>
  );
}
