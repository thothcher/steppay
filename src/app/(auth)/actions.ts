"use server";

import { redirect } from "next/navigation";
import { sqlOne } from "@/lib/db";
import { checkPassword, createSession, destroySession, hashPassword, isAdminEmail } from "@/lib/auth";

export type AuthState = { error?: string; fields?: Record<string, string> };

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const fields = { email };
  if (!emailOk(email) || !password) return { error: "Enter your e-mail and password.", fields };

  const user = await sqlOne<{ id: number; password_hash: string; role: string }>("SELECT id, password_hash, role FROM users WHERE email = $1", [
    email,
  ]);
  if (!user || !checkPassword(password, user.password_hash)) {
    return { error: "Wrong e-mail or password.", fields };
  }
  if (isAdminEmail(email) && user.role !== "admin") {
    await sqlOne("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
  }
  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/portal") ? next : "/portal/home");
}

export async function register(_prev: AuthState, form: FormData): Promise<AuthState> {
  const fullName = String(form.get("full_name") ?? "").trim();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const group = String(form.get("group_name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "").trim();
  const fields = { full_name: fullName, email, group_name: group };

  if (fullName.length < 2) return { error: "Please enter your full name.", fields };
  if (!emailOk(email)) return { error: "Please enter a valid e-mail address.", fields };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", fields };

  const requiredCode = process.env.REGISTRATION_CODE?.trim();
  if (requiredCode && code !== requiredCode) {
    return { error: "Academy code is not correct. Ask your lecturer for it.", fields };
  }

  const exists = await sqlOne("SELECT 1 FROM users WHERE email = $1", [email]);
  if (exists) return { error: "An account with this e-mail already exists. Sign in instead.", fields };

  const user = await sqlOne<{ id: number }>(
    `INSERT INTO users (email, password_hash, full_name, group_name, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [email, hashPassword(password), fullName.slice(0, 120), group.slice(0, 60), isAdminEmail(email) ? "admin" : "student"],
  );
  await createSession(user!.id);
  redirect("/portal/activation");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
