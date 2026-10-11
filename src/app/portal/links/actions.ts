"use server";

import { refresh } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { randomId } from "@/lib/ids";
import { parseMajor } from "@/lib/money";
import { CURRENCIES } from "@/lib/brand";
import { isHttpUrl } from "@/lib/url";

export type LinkState = { error?: string; ok?: string };

export async function createLink(_prev: LinkState, form: FormData): Promise<LinkState> {
  const user = await requireUser();
  const merchantRef = Number(form.get("merchant"));
  const merchant = await sqlOne("SELECT id FROM merchants WHERE id = $1 AND user_id = $2", [merchantRef, user.id]);
  if (!merchant) return { error: "Choose a merchant." };
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const currency = String(form.get("currency") ?? "GEL");
  const open = form.get("open_amount") === "on";
  const amountRaw = String(form.get("amount") ?? "");
  const responseUrl = String(form.get("response_url") ?? "").trim();
  if (title.length < 2) return { error: "Give the link a title (what is the customer paying for?)." };
  if (!(CURRENCIES as readonly string[]).includes(currency)) return { error: "Unsupported currency." };
  const amount = open ? null : parseMajor(amountRaw);
  if (!open && (!amount || amount <= 0)) return { error: "Enter a price like 15.00 — or let the customer choose the amount." };
  if (responseUrl && !isHttpUrl(responseUrl)) return { error: "Redirect URL must start with http:// or https://" };
  await sql(`INSERT INTO payment_links (merchant_ref, slug, title, description, amount, currency, response_url) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
    merchantRef,
    randomId(10),
    title.slice(0, 120),
    description.slice(0, 500),
    amount,
    currency,
    responseUrl,
  ]);
  refresh();
  return { ok: "Payment link created." };
}

async function ownLink(userId: number, id: number) {
  const l = await sqlOne<{ id: number }>(
    "SELECT l.id FROM payment_links l JOIN merchants m ON m.id = l.merchant_ref WHERE l.id = $1 AND m.user_id = $2",
    [id, userId],
  );
  if (!l) throw new Error("Link not found");
  return l;
}

export async function toggleLink(id: number) {
  const user = await requireUser();
  const l = await ownLink(user.id, id);
  await sql("UPDATE payment_links SET active = NOT active WHERE id = $1", [l.id]);
  refresh();
}

export async function deleteLink(id: number) {
  const user = await requireUser();
  const l = await ownLink(user.id, id);
  await sql("DELETE FROM payment_links WHERE id = $1", [l.id]);
  refresh();
}
