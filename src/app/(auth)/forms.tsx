"use client";

import { useActionState } from "react";
import { Field, Input, Callout } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { login, register, type AuthState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

export function RegisterForm({ needsCode }: { needsCode: boolean }) {
  const [state, action] = useActionState<AuthState, FormData>(register, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      <Field label="Full name" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required defaultValue={state.fields?.full_name} placeholder="Nino Beridze" />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} placeholder="you@example.com" />
      </Field>
      <Field label="Group" htmlFor="group_name" hint="Your academy group, so the lecturer can find you. Example: WD-2026-A">
        <Input id="group_name" name="group_name" defaultValue={state.fields?.group_name} placeholder="WD-2026-A" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="••••••••" />
      </Field>
      {needsCode && (
        <Field label="Academy code" htmlFor="code" hint="Your lecturer gives you this code.">
          <Input id="code" name="code" required placeholder="e.g. STEP-2026" />
        </Field>
      )}
      <SubmitButton size="lg" className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
