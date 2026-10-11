"use client";

import { useActionState, useState } from "react";
import { ChevronDown, CreditCard, Lock, Sparkles } from "lucide-react";
import { cn, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { payAction, type PayState } from "./actions";

type TestCard = { number: string; brand: string; label: string; result: string };

function brandOf(num: string) {
  if (/^4/.test(num)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "MASTERCARD";
  return "";
}

const fmtNumber = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const fmtExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function CheckoutForm({
  token,
  embed,
  amountLabel,
  email,
  testCards,
}: {
  token: string;
  embed: boolean;
  amountLabel: string;
  email: string;
  testCards: TestCard[];
}) {
  const [state, action] = useActionState<PayState, FormData>(payAction.bind(null, token, embed), {});
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");
  const [showCards, setShowCards] = useState(true);
  const digits = number.replace(/\s/g, "");
  const brand = brandOf(digits);

  const fill = (c: TestCard) => {
    setNumber(fmtNumber(c.number));
    const d = new Date();
    setExpiry(`12/${String((d.getFullYear() + 3) % 100).padStart(2, "0")}`);
    setCvv("123");
    if (!holder) setHolder("Test Customer");
  };

  const err = (f: string) => (state.field === f ? state.error : undefined);

  return (
    <div className="space-y-5">
      {/* Live card preview (hidden in the compact SDK popup) */}
      {!embed && (
        <div className="relative mx-auto aspect-[1.586] w-full max-w-[340px] overflow-hidden rounded-[18px] bg-gradient-to-br from-forest-700 via-forest-900 to-forest-950 p-5 text-white shadow-pop">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-lime-300/25 blur-2xl" />
          <div className="flex items-start justify-between">
            <div className="h-8 w-11 rounded-md bg-gradient-to-br from-[#f3e2a6] to-[#c9a94e] opacity-90" />
            <span className="text-[13px] font-black italic tracking-tight">
              {brand === "VISA" ? (
                "VISA"
              ) : brand === "MASTERCARD" ? (
                <span className="relative inline-block h-6 w-10">
                  <span className="absolute left-0 size-6 rounded-full bg-[#eb001b]" />
                  <span className="absolute right-0 size-6 rounded-full bg-[#f79e1b] mix-blend-screen" />
                </span>
              ) : (
                <CreditCard className="size-6 opacity-70" />
              )}
            </span>
          </div>
          <div className="mt-6 font-mono text-[19px] tracking-[0.12em] tnum sm:text-[20px]">{number || "•••• •••• •••• ••••"}</div>
          <div className="mt-4 flex items-end justify-between gap-3 text-[11px] uppercase tracking-wider">
            <div className="min-w-0">
              <div className="text-white/50">Card holder</div>
              <div className="truncate text-[13px] font-semibold">{holder || "Your name"}</div>
            </div>
            <div className="text-right">
              <div className="text-white/50">Expires</div>
              <div className="font-mono text-[13px] font-semibold">{expiry || "MM/YY"}</div>
            </div>
          </div>
        </div>
      )}

      <form action={action} className="space-y-4" autoComplete="off">
        {state.error && !state.field && (
          <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[13.5px] font-medium text-red-700">{state.error}</div>
        )}
        <div>
          <label htmlFor="number" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Card number
          </label>
          <input
            id="number"
            name="number"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={number}
            onChange={(e) => setNumber(fmtNumber(e.target.value))}
            className={cn(inputClass, "h-12 font-mono text-[15px] tracking-wider", err("number") && "border-red-400")}
            required
          />
          {err("number") && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{err("number")}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="expiry" className="mb-1.5 block text-[13px] font-semibold text-ink">
              Expiry date
            </label>
            <input
              id="expiry"
              name="expiry"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
              className={cn(inputClass, "h-12 font-mono text-[15px]", err("expiry") && "border-red-400")}
              required
            />
            {err("expiry") && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{err("expiry")}</p>}
          </div>
          <div>
            <label htmlFor="cvv" className="mb-1.5 block text-[13px] font-semibold text-ink">
              CVV
            </label>
            <input
              id="cvv"
              name="cvv"
              inputMode="numeric"
              placeholder="123"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={cn(inputClass, "h-12 font-mono text-[15px]", err("cvv") && "border-red-400")}
              required
            />
            {err("cvv") && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{err("cvv")}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="holder" className="mb-1.5 block text-[13px] font-semibold text-ink">
            Cardholder name <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <input
            id="holder"
            name="holder"
            placeholder="NAME SURNAME"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            className={cn(inputClass, "h-12 uppercase")}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink">
            E-mail for the receipt <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            defaultValue={email}
            className={cn(inputClass, "h-12", err("email") && "border-red-400")}
          />
          {err("email") && <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{err("email")}</p>}
        </div>
        <SubmitButton size="lg" className="h-13 w-full text-[16px]" pendingText="Processing payment…">
          <Lock className="size-4" /> Pay {amountLabel}
        </SubmitButton>
      </form>

      {/* Test cards */}
      <div className="overflow-hidden rounded-2xl border border-lime-200 bg-lime-50">
        <button type="button" onClick={() => setShowCards((s) => !s)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
          <Sparkles className="size-4 text-forest-700" />
          <span className="flex-1 text-[13.5px] font-bold text-forest-900">Test cards — click one to fill the form</span>
          <ChevronDown className={cn("size-4 text-forest-700 transition-transform", showCards && "rotate-180")} />
        </button>
        {showCards && (
          <ul className="border-t border-lime-200 bg-white/60">
            {testCards.map((c) => (
              <li key={c.number}>
                <button type="button" onClick={() => fill(c)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-lime-100/60">
                  <span className={cn("size-2 shrink-0 rounded-full", c.result === "approved" ? "bg-brand-500" : "bg-red-500")} />
                  <span className="shrink-0 whitespace-nowrap font-mono text-[13px] text-ink tnum">{fmtNumber(c.number)}</span>
                  <span className="ml-auto min-w-0 truncate text-right text-[12px] text-ink-2" title={c.label}>
                    {c.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
