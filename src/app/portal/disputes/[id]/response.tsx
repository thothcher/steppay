"use client";

import { useActionState, useTransition } from "react";
import { Callout, Field, Input, Textarea, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { acceptDispute, submitEvidence, type DisputeState } from "../actions";

export function DisputeResponse({ id }: { id: number }) {
  const [state, action] = useActionState<DisputeState, FormData>(submitEvidence.bind(null, id), {});
  const [pending, start] = useTransition();
  return (
    <form action={action} className="space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <Field label="What happened?" htmlFor="evidence" hint="Describe the goods, the delivery and any contact with the customer.">
        <Textarea
          id="evidence"
          name="evidence"
          rows={6}
          placeholder="The customer ordered 2 pizzas on 10 Oct at 19:40. Courier Giorgi delivered them at 20:15 to 12 Rustaveli Ave; the customer signed the receipt…"
        />
      </Field>
      <Field label="Tracking / delivery reference (optional)" htmlFor="tracking">
        <Input id="tracking" name="tracking" placeholder="DLV-2026-10-0042" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingText="Submitting…">Submit evidence</SubmitButton>
        <button type="button" disabled={pending} onClick={() => start(() => acceptDispute(id))} className={buttonClass("secondary")}>
          Accept chargeback
        </button>
      </div>
    </form>
  );
}
