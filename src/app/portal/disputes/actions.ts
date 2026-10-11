"use server";

import { redirect } from "next/navigation";
import { sql, sqlOne } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { disputeClosed } from "@/lib/gateway";

export type DisputeState = { error?: string };

async function ownedDispute(userId: number, isAdmin: boolean, id: number) {
  const d = await sqlOne<{ id: number; payment_ref: number; status: string; user_id: number }>(
    `SELECT d.id, d.payment_ref, d.status, m.user_id FROM disputes d
       JOIN payments p ON p.id = d.payment_ref JOIN merchants m ON m.id = p.merchant_ref WHERE d.id = $1`,
    [id],
  );
  if (!d || (d.user_id !== userId && !isAdmin)) throw new Error("Dispute not found");
  return d;
}

export async function submitEvidence(id: number, _prev: DisputeState, form: FormData): Promise<DisputeState> {
  const user = await requireUser();
  const d = await ownedDispute(user.id, user.role === "admin", id);
  if (d.status !== "needs_response") return { error: "This dispute is not waiting for a response." };
  const evidence = String(form.get("evidence") ?? "").trim();
  const tracking = String(form.get("tracking") ?? "").trim();
  const text = [evidence, tracking && `Tracking / delivery reference: ${tracking}`].filter(Boolean).join("\n\n");
  if (text.length < 10) return { error: "Describe what happened — the more details, the better your chances." };
  await sql("UPDATE disputes SET status = 'under_review', evidence = $2, evidence_at = now() WHERE id = $1", [d.id, text.slice(0, 5000)]);
  redirect(`/portal/disputes/${d.id}`);
}

export async function acceptDispute(id: number) {
  const user = await requireUser();
  const d = await ownedDispute(user.id, user.role === "admin", id);
  if (d.status !== "needs_response") redirect(`/portal/disputes/${d.id}`);
  await sql("UPDATE disputes SET status = 'lost', resolved_at = now(), evidence = 'Accepted by merchant' WHERE id = $1", [d.id]);
  await disputeClosed(d.id, d.payment_ref, false);
  redirect(`/portal/disputes/${d.id}`);
}
