"use server";

import { refresh } from "next/cache";
import { sql } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { randomId } from "@/lib/ids";

export async function resetPassword(userId: number): Promise<{ password: string }> {
  await requireAdmin();
  const password = `step-${randomId(4)}-${randomId(4)}`;
  await sql("UPDATE users SET password_hash = $2 WHERE id = $1", [userId, hashPassword(password)]);
  await sql("DELETE FROM sessions WHERE user_id = $1", [userId]);
  return { password };
}

export async function setRole(userId: number, role: "student" | "admin") {
  const admin = await requireAdmin();
  if (admin.id === userId) return; // don't lock yourself out
  await sql("UPDATE users SET role = $2 WHERE id = $1", [userId, role]);
  refresh();
}
