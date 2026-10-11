// Aggregations for the dashboard, settlements and reports.
import { sql, sqlOne } from "./db";
import { TZ, daysBetween, isoDay } from "./dates";

export type Scope = { userId: number; merchantRef: number | null };

// $1 = user id, $2 = merchant ref (or NULL for all), $3 = tz, $4 = from day, $5 = to day
const SCOPE = "m.user_id = $1 AND ($2::int IS NULL OR m.id = $2)";
const RANGE = (col: string) => `${col} >= ($4::date::timestamp AT TIME ZONE $3) AND ${col} < (($5::date + 1)::timestamp AT TIME ZONE $3)`;

const base = (s: Scope, from: string, to: string) => [s.userId, s.merchantRef, TZ, from, to];

export async function dailySales(s: Scope, from: string, to: string, currency: string) {
  const rows = await sql<{ day: string; amount: number; n: number }>(
    `SELECT to_char((p.paid_at AT TIME ZONE $3)::date, 'YYYY-MM-DD') AS day, sum(p.amount)::float8 AS amount, count(*)::int AS n
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref
      WHERE ${SCOPE} AND p.status IN ('approved','reversed') AND p.currency = $6 AND ${RANGE("p.paid_at")}
      GROUP BY 1`,
    [...base(s, from, to), currency],
  );
  const map = new Map(rows.map((r) => [r.day, r]));
  return daysBetween(from, to).map((day) => ({ day, value: map.get(day)?.amount ?? 0, count: map.get(day)?.n ?? 0 }));
}

/** Net settlement amounts per settlement day (T+1 after capture, activated companies only). */
export async function dailySettlements(s: Scope, from: string, to: string, currency: string) {
  const rows = await sql<{ day: string; net: number; n: number }>(
    `SELECT to_char((p.captured_at AT TIME ZONE $3)::date + 1, 'YYYY-MM-DD') AS day,
            sum(p.amount - p.reversal_amount - round(p.amount * m.fee_bps / 10000.0))::float8 AS net, count(*)::int AS n
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref JOIN companies c ON c.id = m.company_id
      WHERE ${SCOPE} AND c.status = 'activated' AND p.captured AND p.status IN ('approved','reversed') AND p.currency = $6
        AND (p.captured_at AT TIME ZONE $3)::date + 1 BETWEEN $4::date AND LEAST($5::date, $7::date)
      GROUP BY 1`,
    [...base(s, from, to), currency, isoDay()],
  );
  const map = new Map(rows.map((r) => [r.day, r]));
  return daysBetween(from, to).map((day) => ({ day, value: map.get(day)?.net ?? 0, count: map.get(day)?.n ?? 0 }));
}

export async function summary(s: Scope, from: string, to: string, currency: string) {
  const row = await sqlOne<{
    sales: number;
    sales_n: number;
    declined_n: number;
    finished_n: number;
    refunds: number;
    refunds_n: number;
    created_n: number;
  }>(
    `SELECT
       COALESCE(sum(p.amount) FILTER (WHERE p.status IN ('approved','reversed') AND ${RANGE("p.paid_at")}), 0)::float8 AS sales,
       count(*) FILTER (WHERE p.status IN ('approved','reversed') AND ${RANGE("p.paid_at")})::int AS sales_n,
       count(*) FILTER (WHERE p.status = 'declined' AND ${RANGE("p.created_at")})::int AS declined_n,
       count(*) FILTER (WHERE p.status IN ('approved','reversed','declined','expired') AND ${RANGE("p.created_at")})::int AS finished_n,
       count(*) FILTER (WHERE ${RANGE("p.created_at")})::int AS created_n,
       (SELECT COALESCE(sum(r.amount), 0) FROM refunds r JOIN payments p2 ON p2.id = r.payment_ref JOIN merchants m2 ON m2.id = p2.merchant_ref
         WHERE m2.user_id = $1 AND ($2::int IS NULL OR m2.id = $2) AND p2.currency = $6 AND ${RANGE("r.created_at")})::float8 AS refunds,
       (SELECT count(*) FROM refunds r JOIN payments p2 ON p2.id = r.payment_ref JOIN merchants m2 ON m2.id = p2.merchant_ref
         WHERE m2.user_id = $1 AND ($2::int IS NULL OR m2.id = $2) AND p2.currency = $6 AND ${RANGE("r.created_at")})::int AS refunds_n
     FROM payments p JOIN merchants m ON m.id = p.merchant_ref
     WHERE ${SCOPE} AND p.currency = $6`,
    [...base(s, from, to), currency],
  );
  const approvedInRange = await sqlOne<{ n: number }>(
    `SELECT count(*)::int AS n FROM payments p JOIN merchants m ON m.id = p.merchant_ref
      WHERE ${SCOPE} AND p.currency = $6 AND p.status IN ('approved','reversed') AND ${RANGE("p.created_at")}`,
    [...base(s, from, to), currency],
  );
  const r = row!;
  const conversion = r.finished_n > 0 ? Math.round(((approvedInRange?.n ?? 0) / r.finished_n) * 1000) / 10 : null;
  return { ...r, conversion };
}

export async function settlementSummary(s: Scope, from: string, to: string, currency: string) {
  const row = await sqlOne<{ settled: number; settled_n: number; scheduled: number; on_hold: number; fees: number }>(
    `SELECT
       COALESCE(sum(p.amount - p.reversal_amount - round(p.amount * m.fee_bps / 10000.0)) FILTER (WHERE c.status = 'activated' AND (p.captured_at AT TIME ZONE $3)::date + 1 <= $7::date), 0)::float8 AS settled,
       count(*) FILTER (WHERE c.status = 'activated' AND (p.captured_at AT TIME ZONE $3)::date + 1 <= $7::date)::int AS settled_n,
       COALESCE(sum(p.amount - p.reversal_amount - round(p.amount * m.fee_bps / 10000.0)) FILTER (WHERE c.status = 'activated' AND (p.captured_at AT TIME ZONE $3)::date + 1 > $7::date), 0)::float8 AS scheduled,
       COALESCE(sum(p.amount - p.reversal_amount - round(p.amount * m.fee_bps / 10000.0)) FILTER (WHERE c.status IS DISTINCT FROM 'activated'), 0)::float8 AS on_hold,
       COALESCE(sum(round(p.amount * m.fee_bps / 10000.0)), 0)::float8 AS fees
     FROM payments p JOIN merchants m ON m.id = p.merchant_ref LEFT JOIN companies c ON c.id = m.company_id
     WHERE ${SCOPE} AND p.captured AND p.status IN ('approved','reversed') AND p.currency = $6 AND ${RANGE("p.captured_at")}`,
    [...base(s, from, to), currency, isoDay()],
  );
  return row!;
}

export async function breakdowns(s: Scope, from: string, to: string) {
  const args = base(s, from, to);
  const [statuses, cards, sources] = await Promise.all([
    sql<{ key: string; n: number }>(
      `SELECT p.status AS key, count(*)::int AS n FROM payments p JOIN merchants m ON m.id = p.merchant_ref
        WHERE ${SCOPE} AND ${RANGE("p.created_at")} GROUP BY 1 ORDER BY 2 DESC`,
      args,
    ),
    sql<{ key: string; n: number }>(
      `SELECT p.card_type AS key, count(*)::int AS n FROM payments p JOIN merchants m ON m.id = p.merchant_ref
        WHERE ${SCOPE} AND ${RANGE("p.created_at")} AND p.card_type <> '' GROUP BY 1 ORDER BY 2 DESC`,
      args,
    ),
    sql<{ key: string; n: number }>(
      `SELECT p.source AS key, count(*)::int AS n FROM payments p JOIN merchants m ON m.id = p.merchant_ref
        WHERE ${SCOPE} AND ${RANGE("p.created_at")} GROUP BY 1 ORDER BY 2 DESC`,
      args,
    ),
  ]);
  return { statuses, cards, sources };
}

export type SettlementRow = {
  day: string;
  merchant_ref: number;
  merchant_name: string;
  currency: string;
  n: number;
  gross: number;
  refunds: number;
  fees: number;
  net: number;
  activated: boolean;
  iban: string | null;
};

export async function settlementRows(s: Scope, from: string, to: string) {
  return sql<SettlementRow>(
    `SELECT to_char((p.captured_at AT TIME ZONE $3)::date + 1, 'YYYY-MM-DD') AS day, m.id AS merchant_ref, m.name AS merchant_name, p.currency,
            count(*)::int AS n, sum(p.amount)::float8 AS gross, sum(p.reversal_amount)::float8 AS refunds,
            sum(round(p.amount * m.fee_bps / 10000.0))::float8 AS fees,
            sum(p.amount - p.reversal_amount - round(p.amount * m.fee_bps / 10000.0))::float8 AS net,
            bool_or(c.status = 'activated') AS activated, max(c.iban) AS iban
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref LEFT JOIN companies c ON c.id = m.company_id
      WHERE ${SCOPE} AND p.captured AND p.status IN ('approved','reversed')
        AND (p.captured_at AT TIME ZONE $3)::date + 1 BETWEEN $4::date AND $5::date
      GROUP BY 1, m.id, m.name, p.currency
      ORDER BY 1 DESC, m.name`,
    base(s, from, to),
  );
}
