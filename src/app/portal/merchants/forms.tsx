"use client";

import { useActionState, useState, useTransition } from "react";
import { RefreshCw, Trash2, Power } from "lucide-react";
import { Callout, Field, Input, Select, buttonClass } from "@/components/ui";
import { Dialog, SubmitButton } from "@/components/ui/client";
import { createMerchant, deleteMerchant, regenerateSecret, toggleMerchant, updateMerchant, type FormState } from "./actions";

export function NewMerchantForm({ companies }: { companies: { id: number; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(createMerchant, {});
  const [company, setCompany] = useState(companies[0] ? String(companies[0].id) : "new");
  return (
    <form action={action} className="space-y-5">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <Field label="Merchant name" htmlFor="name" hint="Usually the name of your shop or website.">
        <Input id="name" name="name" required placeholder="Pizza Step — online orders" />
      </Field>
      <Field label="Website URL" htmlFor="url" hint="Where the shop runs. You can change it later (localhost is fine while developing).">
        <Input id="url" name="url" placeholder="https://pizza-step.netlify.app" />
      </Field>
      <Field label="Company" htmlFor="company_id">
        <Select id="company_id" name="company_id" value={company} onChange={(e) => setCompany(e.target.value)}>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="new">+ New company</option>
        </Select>
      </Field>
      {company === "new" && (
        <Field label="Company name" htmlFor="company_name" hint="Leave empty to use the merchant name.">
          <Input id="company_name" name="company_name" placeholder="I/E Nino Beridze" />
        </Field>
      )}
      <SubmitButton pendingText="Creating…">Create merchant</SubmitButton>
    </form>
  );
}

export function MerchantSettingsForm({
  merchant,
}: {
  merchant: { id: number; name: string; url: string; callback_url: string; allow_unsigned: boolean };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateMerchant.bind(null, merchant.id), {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      {state.ok && <Callout tone="success">{state.ok}</Callout>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Merchant name" htmlFor="name">
          <Input id="name" name="name" defaultValue={merchant.name} required />
        </Field>
        <Field label="Website URL" htmlFor="url">
          <Input id="url" name="url" defaultValue={merchant.url} placeholder="https://my-shop.netlify.app" />
        </Field>
      </div>
      <Field
        label="Default server callback URL"
        htmlFor="callback_url"
        hint="Optional. Used when a payment request has no server_callback_url. Must be reachable from the internet."
      >
        <Input id="callback_url" name="callback_url" defaultValue={merchant.callback_url} placeholder="https://api.my-shop.com/payments/callback" />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-[#fafbfa] p-4">
        <input type="checkbox" name="allow_unsigned" defaultChecked={merchant.allow_unsigned} className="mt-0.5 size-4 accent-brand-600" />
        <span>
          <span className="block text-[14px] font-semibold text-ink">Allow frontend payments (without signature)</span>
          <span className="mt-0.5 block text-[13px] text-ink-2">
            Lets the JavaScript SDK and payment links create payments with only your <code className="font-mono">merchant_id</code>. Handy for
            projects without a backend. Turn it off to require a signed request from your server for every payment.
          </span>
        </span>
      </label>
      <SubmitButton pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}

export function RegenerateSecret({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <Dialog
      title="Generate a new secret key?"
      description="The old key stops working immediately. Update it everywhere you use it (your backend, .env files)."
      trigger={
        <>
          <RefreshCw className="size-4" /> Regenerate secret
        </>
      }
      triggerClassName={buttonClass("secondary", "sm")}
    >
      {(close) => (
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonClass("secondary")} onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            className={buttonClass("primary")}
            onClick={() =>
              start(async () => {
                await regenerateSecret(id);
                close();
              })
            }
          >
            {pending ? "Generating…" : "Generate new key"}
          </button>
        </div>
      )}
    </Dialog>
  );
}

export function DangerZone({ id, active }: { id: number; active: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
      {error && <Callout tone="danger">{error}</Callout>}
      <button type="button" disabled={pending} onClick={() => start(() => toggleMerchant(id))} className={buttonClass("secondary", "md", "w-full")}>
        <Power className="size-4" /> {active ? "Disable merchant" : "Enable merchant"}
      </button>
      <Dialog
        title="Delete this merchant?"
        description="Only merchants without payments can be deleted. This cannot be undone."
        trigger={
          <>
            <Trash2 className="size-4" /> Delete merchant
          </>
        }
        triggerClassName={buttonClass("danger", "md", "w-full")}
      >
        {(close) => (
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("secondary")} onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              className={buttonClass("danger")}
              onClick={() =>
                start(async () => {
                  const res = await deleteMerchant(id);
                  if (res?.error) setError(res.error);
                  close();
                })
              }
            >
              Delete
            </button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
