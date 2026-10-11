"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Undo2, X } from "lucide-react";
import { buttonClass, cn } from "@/components/ui";

export function ResultView({
  status,
  amount,
  merchantName,
  orderId,
  paymentId,
  card,
  reason,
  returnUrl,
  embed,
  data,
}: {
  status: string;
  amount: string;
  merchantName: string;
  orderId: string;
  paymentId: number;
  card: string;
  reason: string;
  returnUrl: string;
  embed: boolean;
  data: Record<string, string | number>;
}) {
  const approved = status === "approved";
  const [seconds, setSeconds] = useState(5);

  // Inside the SDK modal: tell the parent page what happened.
  useEffect(() => {
    if (embed && window.parent !== window) {
      window.parent.postMessage({ source: "steppay", type: "result", data }, "*");
    }
  }, [embed, data]);

  // Full-page checkout: go back to the shop automatically.
  useEffect(() => {
    if (embed || !returnUrl) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [embed, returnUrl]);
  useEffect(() => {
    if (seconds <= 0 && returnUrl && !embed) window.location.href = returnUrl;
  }, [seconds, returnUrl, embed]);

  const view = {
    approved: { icon: Check, ring: "bg-brand-500", title: "Payment successful", text: `${amount} paid to ${merchantName}.` },
    declined: { icon: X, ring: "bg-red-500", title: "Payment declined", text: reason || "The bank declined this card." },
    reversed: { icon: Undo2, ring: "bg-violet-500", title: "Payment refunded", text: `This payment was refunded by ${merchantName}.` },
    expired: { icon: Clock, ring: "bg-ink-3", title: "Payment expired", text: "This checkout is no longer valid." },
  }[status] ?? { icon: Clock, ring: "bg-ink-3", title: status, text: "" };
  const Icon = view.icon;

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-7 text-center shadow-card sm:p-9">
      <div className={cn("mx-auto grid size-[72px] animate-pop place-items-center rounded-full text-white", view.ring)}>
        <Icon className="size-9 stroke-[3]" />
      </div>
      <h1 className="mt-5 text-[24px] font-extrabold tracking-tight">{view.title}</h1>
      <p className="mt-1.5 text-[15px] text-ink-2">{view.text}</p>

      <dl className="mt-6 space-y-2 rounded-2xl bg-canvas p-4 text-left text-[13.5px]">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">Amount</dt>
          <dd className="font-semibold">{amount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">Order</dt>
          <dd className="truncate font-mono text-[12.5px]">{orderId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-3">Payment ID</dt>
          <dd className="font-mono text-[12.5px]">{paymentId}</dd>
        </div>
        {card && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">Card</dt>
            <dd className="font-mono text-[12.5px]">{card}</dd>
          </div>
        )}
      </dl>

      {embed ? (
        <p className="mt-6 text-[13px] text-ink-3">{approved ? "Returning to the shop…" : "You can close this window."}</p>
      ) : returnUrl ? (
        <>
          <a href={returnUrl} className={buttonClass(approved ? "primary" : "secondary", "lg", "mt-6 w-full")}>
            Return to {merchantName}
          </a>
          <p className="mt-3 text-[12.5px] text-ink-3 tnum">Redirecting automatically in {Math.max(0, seconds)} s…</p>
        </>
      ) : (
        <p className="mt-6 text-[13px] text-ink-3">You can close this page now.</p>
      )}
    </div>
  );
}
