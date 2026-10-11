// GET /api/portal/export?type=payments|settlements|disputes|refunds — CSV download for the logged-in user.
import { getScope } from "@/lib/portal";
import { readRange, TZ, fmtDateTime } from "@/lib/dates";
import { exportPayments } from "@/lib/queries";
import { settlementRows } from "@/lib/stats";
import { sql } from "@/lib/db";
import { minorToMajor } from "@/lib/money";

export const dynamic = "force-dynamic";

function csv(rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    // Text like "=SUM(...)" would run as a formula in Excel — neutralise it.
    if (/^[=+@]|^-[^\d]/.test(s)) s = `'${s}`;
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export async function GET(req: Request) {
  const { user, merchantRef } = await getScope();
  const url = new URL(req.url);
  const p = (k: string) => url.searchParams.get(k) ?? "";
  const type = p("type") || "payments";
  const { from, to } = readRange({ from: p("from"), to: p("to") }, 30);
  let rows: (string | number | null)[][] = [];

  if (type === "payments") {
    const data = await exportPayments({ userId: user.id, merchantRef, from, to, tab: p("tab") || "all", status: p("status"), q: p("q") });
    rows = [
      [
        "created_at",
        "payment_id",
        "order_id",
        "merchant",
        "order_desc",
        "amount",
        "currency",
        "status",
        "refunded",
        "card_type",
        "masked_card",
        "sender_email",
        "source",
        "rrn",
        "response_code",
        "response_description",
      ],
      ...data.map((r) => [
        fmtDateTime(r.created_at),
        r.payment_id,
        r.order_id,
        r.merchant_name,
        r.order_desc,
        minorToMajor(r.amount),
        r.currency,
        r.status,
        minorToMajor(r.reversal_amount),
        r.card_type,
        r.masked_card,
        r.sender_email,
        r.source,
        r.rrn,
        r.response_code,
        r.response_description,
      ]),
    ];
  } else if (type === "settlements") {
    const data = await settlementRows({ userId: user.id, merchantRef }, from, to);
    rows = [
      ["settlement_date", "merchant", "currency", "payments", "gross", "refunds", "fees", "net", "activated", "iban"],
      ...data.map((r) => [
        r.day,
        r.merchant_name,
        r.currency,
        r.n,
        minorToMajor(r.gross),
        minorToMajor(r.refunds),
        minorToMajor(r.fees),
        minorToMajor(r.net),
        r.activated ? "yes" : "no",
        r.iban,
      ]),
    ];
  } else if (type === "disputes" || type === "refunds") {
    const table = type === "disputes" ? "disputes" : "refunds";
    const data = await sql(
      `SELECT x.*, p.payment_id, p.order_id, p.currency, m.name AS merchant_name
         FROM ${table} x JOIN payments p ON p.id = x.payment_ref JOIN merchants m ON m.id = p.merchant_ref
        WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2)
          AND x.created_at >= ($4::date::timestamp AT TIME ZONE $3) AND x.created_at < (($5::date + 1)::timestamp AT TIME ZONE $3)
        ORDER BY x.created_at DESC`,
      [user.id, merchantRef, TZ, from, to],
    );
    rows =
      type === "disputes"
        ? [
            ["opened_at", "payment_id", "order_id", "merchant", "amount", "currency", "reason_code", "reason", "status", "due_at", "resolved_at"],
            ...data.map((r) => [
              fmtDateTime(r.created_at),
              r.payment_id,
              r.order_id,
              r.merchant_name,
              minorToMajor(r.amount),
              r.currency,
              r.reason_code,
              r.reason,
              r.status,
              fmtDateTime(r.due_at),
              r.resolved_at ? fmtDateTime(r.resolved_at) : "",
            ]),
          ]
        : [
            ["refunded_at", "payment_id", "order_id", "merchant", "amount", "currency", "source", "comment"],
            ...data.map((r) => [
              fmtDateTime(r.created_at),
              r.payment_id,
              r.order_id,
              r.merchant_name,
              minorToMajor(r.amount),
              r.currency,
              r.source,
              r.comment,
            ]),
          ];
  } else {
    return new Response("Unknown report type", { status: 400 });
  }

  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="steppay-${type}-${from}-to-${to}.csv"`,
    },
  });
}
