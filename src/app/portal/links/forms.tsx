"use client";

import { useActionState, useState, useTransition } from "react";
import { Power, Trash2 } from "lucide-react";
import { Callout, Field, Input, Select, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { createLink, deleteLink, toggleLink, type LinkState } from "./actions";

export function NewLinkForm({ merchants, defaultMerchant }: { merchants: { id: number; name: string }[]; defaultMerchant?: number }) {
  const [state, action] = useActionState<LinkState, FormData>(createLink, {});
  const [open, setOpen] = useState(false);
  return (
    <form action={action} className="space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      {state.ok && <Callout tone="success">{state.ok}</Callout>}
      <Field label="Merchant" htmlFor="merchant">
        <Select id="merchant" name="merchant" defaultValue={defaultMerchant}>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="What are you selling?" htmlFor="title">
        <Input id="title" name="title" required placeholder="Family pizza set" />
      </Field>
      <Field label="Description (optional)" htmlFor="description">
        <Input id="description" name="description" placeholder="2 large pizzas + lemonade" />
      </Field>
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <Field label="Price" htmlFor="amount">
          <Input id="amount" name="amount" inputMode="decimal" placeholder="45.00" disabled={open} />
        </Field>
        <Field label="Currency" htmlFor="currency">
          <Select id="currency" name="currency" defaultValue="GEL">
            <option>GEL</option>
            <option>USD</option>
            <option>EUR</option>
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
        <input type="checkbox" name="open_amount" checked={open} onChange={(e) => setOpen(e.target.checked)} className="size-4 accent-brand-600" />
        Customer chooses the amount (donations, tips)
      </label>
      <Field label="Redirect after payment (optional)" htmlFor="response_url" hint="Your thank-you page. It receives the result in the URL.">
        <Input id="response_url" name="response_url" placeholder="https://my-shop.netlify.app/thank-you.html" />
      </Field>
      <SubmitButton pendingText="Creating…" className="w-full">
        Create payment link
      </SubmitButton>
    </form>
  );
}

export function LinkControls({ id, active }: { id: number; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => toggleLink(id))}
        className={buttonClass("ghost", "sm")}
        title={active ? "Disable" : "Enable"}
      >
        <Power className="size-4" /> {active ? "Disable" : "Enable"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this payment link?")) start(() => deleteLink(id));
        }}
        className={buttonClass("ghost", "sm", "text-red-700 hover:bg-red-50")}
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
