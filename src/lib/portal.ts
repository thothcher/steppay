// Data helpers shared by portal pages.
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { sql, sqlOne } from "./db";
import { requireUser, type User } from "./auth";
import type { Merchant, Payment } from "./gateway";

export const MERCHANT_COOKIE = "sp_merchant";

export type MerchantRow = Merchant & {
  company_name: string | null;
  company_status: string | null;
};

export function merchantStatus(m: { active: boolean; company_status: string | null }): "activated" | "pending" | "disabled" {
  if (!m.active) return "disabled";
  return m.company_status === "activated" ? "activated" : "pending";
}

export const getMerchants = cache(async (userId: number) =>
  sql<MerchantRow>(
    `SELECT m.*, c.name AS company_name, c.status AS company_status
       FROM merchants m LEFT JOIN companies c ON c.id = m.company_id
      WHERE m.user_id = $1 ORDER BY m.created_at`,
    [userId],
  ),
);

/** Who is looking and which merchant is selected in the top bar. */
export const getScope = cache(async () => {
  const user = await requireUser();
  const merchants = await getMerchants(user.id);
  const jar = await cookies();
  const selectedId = Number(jar.get(MERCHANT_COOKIE)?.value);
  const selected = merchants.find((m) => m.id === selectedId) ?? null;
  return { user, merchants, selected, merchantRef: selected?.id ?? null };
});

/** A merchant that belongs to the user (admins may open any). */
export async function ownedMerchant(user: User, id: number): Promise<MerchantRow> {
  const m = await sqlOne<MerchantRow>(
    `SELECT m.*, c.name AS company_name, c.status AS company_status
       FROM merchants m LEFT JOIN companies c ON c.id = m.company_id WHERE m.id = $1`,
    [id],
  );
  if (!m || (m.user_id !== user.id && user.role !== "admin")) notFound();
  return m;
}

export type PaymentRow = Payment & { merchant_name: string; merchant_public_id: number; user_id: number };

/** A payment (by public payment_id) that belongs to the user (admins may open any). */
export async function ownedPayment(user: User, paymentId: number): Promise<PaymentRow> {
  if (!Number.isInteger(paymentId)) notFound();
  const p = await sqlOne<PaymentRow>(
    `SELECT p.*, m.name AS merchant_name, m.merchant_id AS merchant_public_id, m.user_id
       FROM payments p JOIN merchants m ON m.id = p.merchant_ref WHERE p.payment_id = $1`,
    [paymentId],
  );
  if (!p || (p.user_id !== user.id && user.role !== "admin")) notFound();
  return p;
}

/** Search-param reader that always returns plain strings. */
export function sp(params: Record<string, string | string[] | undefined>, key: string): string {
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Builds "?a=1&b=2" keeping only non-empty values. */
export function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}
