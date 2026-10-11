"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ownedPayment } from "@/lib/portal";
import { capturePayment, GatewayError, merchantByRef, refundPayment, sendCallback, type Payment } from "@/lib/gateway";
import { parseMajor } from "@/lib/money";

export type ActionState = { error?: string; ok?: string };

async function load(paymentId: number) {
  const user = await requireUser();
  const payment = await ownedPayment(user, paymentId);
  const merchant = (await merchantByRef(payment.merchant_ref))!;
  return { payment: payment as Payment, merchant };
}

export async function refundAction(paymentId: number, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { payment, merchant } = await load(paymentId);
  const amount = parseMajor(String(form.get("amount") ?? ""));
  if (amount === null) return { error: "Enter the amount like 12.50" };
  try {
    await refundPayment(payment, merchant, amount, String(form.get("comment") ?? ""), "portal");
  } catch (e) {
    return { error: e instanceof GatewayError ? e.message : "Refund failed." };
  }
  refresh();
  return { ok: "Refund completed." };
}

export async function captureAction(paymentId: number) {
  const { payment, merchant } = await load(paymentId);
  try {
    await capturePayment(payment, merchant);
  } catch {}
  refresh();
}

export async function resendCallbackAction(paymentId: number) {
  const { payment, merchant } = await load(paymentId);
  await sendCallback(payment, merchant, "manual");
  refresh();
}
