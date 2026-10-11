"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { Callout, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { startLinkPayment, type StartState } from "./actions";

export function PayLinkForm({ slug, openAmount, currency }: { slug: string; openAmount: boolean; currency: string }) {
  const [state, action] = useActionState<StartState, FormData>(startLinkPayment.bind(null, slug), {});
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      {openAmount && (
        <Field label={`Amount (${currency})`} htmlFor="amount">
          <Input id="amount" name="amount" inputMode="decimal" required placeholder="10.00" className="h-12 text-[18px] font-bold" />
        </Field>
      )}
      <Field label="Your e-mail (optional)" htmlFor="email" hint="For the receipt.">
        <Input id="email" name="email" type="email" placeholder="you@example.com" />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Preparing checkout…">
        Continue to payment <ArrowRight className="size-4" />
      </SubmitButton>
    </form>
  );
}
