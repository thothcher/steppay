"use server";

import { redirect } from "next/navigation";
import { chargeCard, submitThreeDS } from "@/lib/gateway";

export type PayState = { error?: string; field?: string };

const suffix = (embed: boolean) => (embed ? "?embed=1" : "");

export async function payAction(token: string, embed: boolean, _prev: PayState, form: FormData): Promise<PayState> {
  const result = await chargeCard(token, {
    number: String(form.get("number") ?? ""),
    expiry: String(form.get("expiry") ?? ""),
    cvv: String(form.get("cvv") ?? ""),
    holder: String(form.get("holder") ?? ""),
    email: String(form.get("email") ?? ""),
  });
  if (result.kind === "error") return { error: result.message, field: result.field };
  if (result.kind === "threeDS") redirect(`/checkout/${token}/3ds${suffix(embed)}`);
  redirect(`/checkout/${token}/result${suffix(embed)}`);
}

export async function threeDSAction(token: string, embed: boolean, _prev: PayState, form: FormData): Promise<PayState> {
  const cancel = form.get("intent") === "cancel";
  const result = await submitThreeDS(token, String(form.get("code") ?? ""), cancel);
  if (result.kind === "error") return { error: result.message };
  redirect(`/checkout/${token}/result${suffix(embed)}`);
}
