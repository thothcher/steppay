"use client";

import { useActionState } from "react";
import { Callout, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { changePassword, updateProfile, type ProfileState } from "./actions";

export function ProfileForm({ fullName, group }: { fullName: string; group: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      {state.ok && <Callout tone="success">{state.ok}</Callout>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" name="full_name" defaultValue={fullName} required />
        </Field>
        <Field label="Group" htmlFor="group_name">
          <Input id="group_name" name="group_name" defaultValue={group} placeholder="WD-2026-A" />
        </Field>
      </div>
      <SubmitButton pendingText="Saving…">Save</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<ProfileState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Callout tone="danger">{state.error}</Callout>}
      {state.ok && <Callout tone="success">{state.ok}</Callout>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current password" htmlFor="current">
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="New password" htmlFor="next" hint="At least 8 characters.">
          <Input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
      </div>
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
