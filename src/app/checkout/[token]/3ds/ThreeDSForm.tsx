"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { cn, inputClass, buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { threeDSAction, type PayState } from "../../actions";

export function ThreeDSForm({ token, embed }: { token: string; embed: boolean }) {
  const [state, action] = useActionState<PayState, FormData>(threeDSAction.bind(null, token, embed), {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="code" className="mb-1.5 block text-[13px] font-semibold text-ink">
          One-time code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="••••"
          className={cn(inputClass, "h-14 text-center font-mono text-[24px] tracking-[0.5em]", state.error && "border-red-400")}
        />
        {state.error && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{state.error}</p>}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-lime-50 px-3.5 py-2.5 text-[13px] text-forest-800 ring-1 ring-lime-200">
        <KeyRound className="size-4 shrink-0" />
        <span>
          Sandbox: the code is <b className="font-mono">1234</b>. Three wrong codes decline the payment.
        </span>
      </div>
      <SubmitButton name="intent" value="confirm" size="lg" className="w-full" pendingText="Verifying…">
        Confirm
      </SubmitButton>
      <button type="submit" name="intent" value="cancel" formNoValidate className={buttonClass("ghost", "md", "w-full")}>
        Cancel payment
      </button>
    </form>
  );
}
