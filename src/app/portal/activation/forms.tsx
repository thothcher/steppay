"use client";

import { useActionState } from "react";
import { Callout, Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { saveCompany, saveDirector, saveIban, type StepState } from "./actions";

type Company = {
  id: number;
  name: string;
  legal_form: string;
  tax_id: string;
  address: string;
  director_name: string;
  director_personal_id: string;
  director_birth_date: string;
  iban: string;
  bank_name: string;
  account_holder: string;
} | null;

export function CompanyForm({ company }: { company: Company }) {
  const [state, action] = useActionState<StepState, FormData>(saveCompany.bind(null, company?.id ?? null), {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Company name" htmlFor="name">
          <Input id="name" name="name" required defaultValue={company?.name} placeholder="I/E Nino Beridze" />
        </Field>
        <Field label="Legal form" htmlFor="legal_form">
          <Select id="legal_form" name="legal_form" defaultValue={company?.legal_form ?? "Individual entrepreneur"}>
            <option>Individual entrepreneur</option>
            <option>Limited liability company (LLC)</option>
            <option>Joint stock company</option>
            <option>Non-profit organization</option>
          </Select>
        </Field>
        <Field label="Tax ID" htmlFor="tax_id" hint="9–11 digits. Invent one — never use real data here.">
          <Input id="tax_id" name="tax_id" required inputMode="numeric" defaultValue={company?.tax_id} placeholder="404123456" />
        </Field>
        <Field label="Legal address" htmlFor="address">
          <Input id="address" name="address" required defaultValue={company?.address} placeholder="12 Rustaveli Ave, Tbilisi" />
        </Field>
      </div>
      {!company && (
        <div className="rounded-2xl border border-dashed border-line-strong bg-[#fafbfa] p-5">
          <div className="mb-4 text-[14px] font-bold text-ink">Your first merchant (website)</div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Merchant name" htmlFor="merchant_name" hint="Leave empty to use the company name.">
              <Input id="merchant_name" name="merchant_name" placeholder="Pizza Step — online orders" />
            </Field>
            <Field label="Website URL" htmlFor="merchant_url" hint="Optional. You can add it later.">
              <Input id="merchant_url" name="merchant_url" placeholder="https://pizza-step.netlify.app" />
            </Field>
          </div>
        </div>
      )}
      <SubmitButton pendingText="Saving…">{company ? "Save & continue" : "Create merchant & continue"}</SubmitButton>
    </form>
  );
}

export function DirectorForm({ company }: { company: NonNullable<Company> }) {
  const [state, action] = useActionState<StepState, FormData>(saveDirector.bind(null, company.id), {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <Callout tone="warning">Sandbox: use invented test data. Never upload real IDs or personal numbers.</Callout>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Director full name" htmlFor="director_name">
          <Input id="director_name" name="director_name" required defaultValue={company.director_name} placeholder="Nino Beridze" />
        </Field>
        <Field label="Personal ID" htmlFor="director_personal_id" hint="11 digits, invented. Example: 01001012345">
          <Input
            id="director_personal_id"
            name="director_personal_id"
            required
            inputMode="numeric"
            maxLength={11}
            defaultValue={company.director_personal_id}
            placeholder="01001012345"
          />
        </Field>
        <Field label="Date of birth" htmlFor="director_birth_date">
          <Input id="director_birth_date" name="director_birth_date" type="date" required defaultValue={company.director_birth_date} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-[14px] text-ink-2">
        <input type="checkbox" name="confirm" className="size-4 accent-brand-600" /> I confirm that I entered test data only.
      </label>
      <SubmitButton pendingText="Verifying…">Verify & continue</SubmitButton>
    </form>
  );
}

export function IbanForm({ company }: { company: NonNullable<Company> }) {
  const [state, action] = useActionState<StepState, FormData>(saveIban.bind(null, company.id), {});
  return (
    <form action={action} className="space-y-5">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="IBAN" htmlFor="iban" hint="Format: GE + 2 digits + 2 letters + 16 digits">
          <Input id="iban" name="iban" required defaultValue={company.iban} placeholder="GE29SB0000000000000001" className="font-mono uppercase" />
        </Field>
        <Field label="Bank" htmlFor="bank_name">
          <Select id="bank_name" name="bank_name" defaultValue={company.bank_name || "Step Bank"}>
            <option>Step Bank</option>
            <option>Academy Bank</option>
            <option>Sandbox Bank</option>
            <option>Demo Credit Union</option>
          </Select>
        </Field>
        <Field label="Account holder" htmlFor="account_holder" className="sm:col-span-2">
          <Input id="account_holder" name="account_holder" required defaultValue={company.account_holder || company.name} />
        </Field>
      </div>
      <SubmitButton pendingText="Saving…">Save & continue</SubmitButton>
    </form>
  );
}
