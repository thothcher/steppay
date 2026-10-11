import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { sql, sqlOne } from "./db";

export const SESSION_COOKIE = "sp_session";
const SESSION_DAYS = 30;

export type User = {
  id: number;
  email: string;
  full_name: string;
  group_name: string;
  role: "student" | "admin";
  created_at: Date;
};

// ── Passwords (scrypt, built into Node — no extra dependency) ───────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function checkPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

export function isAdminEmail(email: string): boolean {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

// ── Sessions ─────────────────────────────────────────────────────────────────
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await sql("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [sha256(token), userId, expires]);
  await sql("UPDATE users SET last_login_at = now() WHERE id = $1", [userId]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Current user for this request (cached per request). */
export const getUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return sqlOne<User>(
    `SELECT u.id, u.email, u.full_name, u.group_name, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/portal/home");
  return user;
}
