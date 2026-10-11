"use server";

import { redirect } from "next/navigation";
import { sqlOne } from "@/lib/db";
import { createOrder, GatewayError, merchantByRef } from "@/lib/gateway";
import { parseMajor } from "@/lib/money";
import { randomId } from "@/lib/ids";

export type StartState = { error?: string };

export async function startLinkPayment(slug: string, _prev: StartState, form: FormData): Promise<StartState> {
  const link = await sqlOne("SELECT * FROM payment_links WHERE slug = $1 AND active", [slug]);
  if (!link) return { error: "This payment link is not active." };
  const merchant = await merchantByRef(link.merchant_ref);
  if (!merchant) return { error: "Merchant not found." };

  const amount = link.amount ?? parseMajor(String(form.get("amount") ?? ""));
  if (!amount || amount <= 0) return { error: "Enter an amount like 10.00" };

  let token: string;
  try {
    const payment = await createOrder(
      merchant,
      {
        order_id: `link_${slug}_${randomId(6)}`,
        order_desc: link.title,
        amount,
        currency: link.currency,
        response_url: link.response_url,
        sender_email: String(form.get("email") ?? ""),
        merchant_data: `link:${slug}`,
      },
      { source: "link", signed: false },
    );
    token = payment.token;
  } catch (e) {
    return { error: e instanceof GatewayError ? e.message : "Could not start the payment." };
  }
  redirect(`/checkout/${token}`);
}
