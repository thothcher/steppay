import { sql } from "./db";

export async function notify(userId: number, n: { kind?: "info" | "success" | "warning" | "danger"; title: string; body?: string; link?: string }) {
  await sql("INSERT INTO notifications (user_id, kind, title, body, link) VALUES ($1, $2, $3, $4, $5)", [
    userId,
    n.kind ?? "info",
    n.title,
    n.body ?? "",
    n.link ?? "",
  ]);
}
