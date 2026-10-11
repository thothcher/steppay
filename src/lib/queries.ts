// Shared list queries (payments table + CSV export use the same filters).
import { sql, sqlOne } from "./db";
import { TZ } from "./dates";

export type PaymentFilters = {
  userId: number;
  merchantRef: number | null;
  from: string;
  to: string;
  tab: string;
  status: string;
  q: string;
};

export const PAYMENT_TABS = [
  { key: "all", label: "All payments" },
  { key: "uncaptured", label: "Uncaptured" },
  { key: "refunds", label: "Refunds" },
  { key: "declined", label: "Declined" },
] as const;

function where(f: PaymentFilters) {
  const params: unknown[] = [f.userId, f.merchantRef, TZ, f.from, f.to];
  const parts = [
    "m.user_id = $1",
    "($2::int IS NULL OR m.id = $2)",
    "p.created_at >= ($4::date::timestamp AT TIME ZONE $3)",
    "p.created_at < (($5::date + 1)::timestamp AT TIME ZONE $3)",
  ];
  const tabSql: Record<string, string> = {
    uncaptured: "p.preauth AND NOT p.captured AND p.status = 'approved'",
    refunds: "p.reversal_amount > 0",
    declined: "p.status = 'declined'",
  };
  if (tabSql[f.tab]) parts.push(tabSql[f.tab]);
  if (f.status) {
    params.push(f.status);
    parts.push(`p.status = $${params.length}`);
  }
  if (f.q) {
    params.push(`%${f.q}%`, f.q);
    const like = `$${params.length - 1}`;
    const exact = `$${params.length}`;
    parts.push(
      `(p.order_id ILIKE ${like} OR p.order_desc ILIKE ${like} OR p.sender_email ILIKE ${like} OR p.merchant_data ILIKE ${like}
        OR p.payment_id::text = ${exact} OR p.rrn = ${exact} OR p.masked_card ILIKE ${like})`,
    );
  }
  return { clause: parts.join(" AND "), params };
}

export async function listPayments(f: PaymentFilters, page: number, perPage = 25) {
  const { clause, params } = where(f);
  const total = await sqlOne<{ n: number }>(
    `SELECT count(*)::int AS n FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE ${clause}`,
    params,
  );
  const rows = await sql(
    `SELECT p.*, m.name AS merchant_name, m.merchant_id AS merchant_public_id
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref
      WHERE ${clause}
      ORDER BY p.created_at DESC
      LIMIT ${perPage} OFFSET ${(Math.max(1, page) - 1) * perPage}`,
    params,
  );
  return { total: total?.n ?? 0, rows };
}

export async function exportPayments(f: PaymentFilters) {
  const { clause, params } = where(f);
  return sql(
    `SELECT p.*, m.name AS merchant_name, m.merchant_id AS merchant_public_id
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref
      WHERE ${clause} ORDER BY p.created_at DESC LIMIT 10000`,
    params,
  );
}

export async function tabCounts(f: PaymentFilters) {
  return sqlOne<{ all: number; uncaptured: number; refunds: number; declined: number }>(
    `SELECT count(*)::int AS "all",
            count(*) FILTER (WHERE p.preauth AND NOT p.captured AND p.status = 'approved')::int AS uncaptured,
            count(*) FILTER (WHERE p.reversal_amount > 0)::int AS refunds,
            count(*) FILTER (WHERE p.status = 'declined')::int AS declined
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref
      WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2)
        AND p.created_at >= ($4::date::timestamp AT TIME ZONE $3) AND p.created_at < (($5::date + 1)::timestamp AT TIME ZONE $3)`,
    [f.userId, f.merchantRef, TZ, f.from, f.to],
  );
}
