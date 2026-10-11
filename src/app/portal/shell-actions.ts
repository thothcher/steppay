"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MERCHANT_COOKIE } from "@/lib/portal";

export async function selectMerchant(id: number | null) {
  const jar = await cookies();
  if (id) jar.set(MERCHANT_COOKIE, String(id), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  else jar.delete(MERCHANT_COOKIE);
  refresh();
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await sql("UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE", [user.id]);
  refresh();
}
