// GET /api/health — quick check that the app and the database work.
import { NextResponse } from "next/server";
import { sqlOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await sqlOne<{ users: number; payments: number }>(
      "SELECT (SELECT count(*) FROM users)::int AS users, (SELECT count(*) FROM payments)::int AS payments",
    );
    const db = process.env.DATABASE_URL || process.env.POSTGRES_URL ? "postgres" : "pglite (local)";
    return NextResponse.json({ ok: true, database: db, ...row });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
