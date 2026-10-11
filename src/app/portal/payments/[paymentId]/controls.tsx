"use client";

import { useActionState, useTransition } from "react";
import { Undo2, Send, Hand } from "lucide-react";
import { Callout, Field, Input, buttonClass } from "@/components/ui";
import { Dialog, SubmitButton } from "@/components/ui/client";
import { captureAction, refundAction, resendCallbackAction, type ActionState } from "../actions";

export function RefundButton({ paymentId, available, currency }: { paymentId: number; available: number; currency: string }) {
  const [state, action] = useActionState<ActionState, FormData>(refundAction.bind(null, paymentId), {});
  return (
    <Dialog
      title="Refund payment"
      description={`Up to ${(available / 100).toFixed(2)} ${currency} can be returned to the customer's card.`}
      trigger={
        <>
          <Undo2 className="size-4" /> Refund
        </>
      }
      triggerClassName={buttonClass("secondary")}
    >
      <form action={action} className="space-y-4">
        {state.error && <Callout tone="danger">{state.error}</Callout>}
        {state.ok && <Callout tone="success">{state.ok}</Callout>}
        <Field label={`Amount (${currency})`} htmlFor="amount" hint="Partial refunds are allowed.">
          <Input id="amount" name="amount" defaultValue={(available / 100).toFixed(2)} inputMode="decimal" />
        </Field>
        <Field label="Comment (optional)" htmlFor="comment">
          <Input id="comment" name="comment" placeholder="Customer returned the order" />
        </Field>
        <SubmitButton pendingText="Refunding…" className="w-full">
          Refund
        </SubmitButton>
      </form>
    </Dialog>
  );
}

export function CaptureButton({ paymentId }: { paymentId: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => captureAction(paymentId))} className={buttonClass("primary")}>
      <Hand className="size-4" /> {pending ? "Capturing…" : "Capture"}
    </button>
  );
}

export function ResendCallbackButton({ paymentId }: { paymentId: number }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => resendCallbackAction(paymentId))} className={buttonClass("secondary")}>
      <Send className="size-4" /> {pending ? "Sending…" : "Resend callback"}
    </button>
  );
}
