"use server";

import { refresh } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { checkPassword, hashPassword, requireUser } from "@/lib/auth";

export type ProfileState = { error?: string; ok?: string };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const fullName = String(form.get("full_name") ?? "").trim();
  const group = String(form.get("group_name") ?? "").trim();
  if (fullName.length < 2) return { error: "Name is too short." };
  await sql("UPDATE users SET full_name = $2, group_name = $3 WHERE id = $1", [user.id, fullName.slice(0, 120), group.slice(0, 60)]);
  refresh();
  return { ok: "Saved." };
}

export async function changePassword(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const row = await sqlOne<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
  if (!row || !checkPassword(current, row.password_hash)) return { error: "Current password is wrong." };
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  await sql("UPDATE users SET password_hash = $2 WHERE id = $1", [user.id, hashPassword(next)]);
  return { ok: "Password updated." };
}
