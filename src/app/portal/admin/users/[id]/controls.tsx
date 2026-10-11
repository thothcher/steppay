"use client";

import { useState, useTransition } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { CopyButton } from "@/components/ui/client";
import { resetPassword, setRole } from "../../actions";

export function AdminControls({ userId, role, isSelf }: { userId: number; role: string; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [password, setPassword] = useState("");
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (!confirm("Generate a new password for this student? Their current sessions will be signed out.")) return;
            const r = await resetPassword(userId);
            setPassword(r.password);
          })
        }
        className={buttonClass("secondary", "md", "w-full")}
      >
        <KeyRound className="size-4" /> Reset password
      </button>
      {password && (
        <div className="rounded-xl bg-lime-50 p-3 ring-1 ring-lime-200">
          <div className="text-[12.5px] text-ink-2">New password — give it to the student:</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <code className="font-mono text-[15px] font-bold">{password}</code>
            <CopyButton value={password} label="Copy" />
          </div>
        </div>
      )}
      {!isSelf && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => setRole(userId, role === "admin" ? "student" : "admin"))}
          className={buttonClass("ghost", "md", "w-full")}
        >
          <ShieldCheck className="size-4" /> {role === "admin" ? "Make student" : "Make lecturer"}
        </button>
      )}
    </div>
  );
}
