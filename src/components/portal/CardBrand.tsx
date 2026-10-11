import { CreditCard } from "lucide-react";

/** Small card-network chip used in tables. */
export function CardBrand({ type, last4 }: { type: string; last4?: string }) {
  let chip: React.ReactNode;
  if (type === "VISA") {
    chip = (
      <span className="grid h-6 w-9 place-items-center rounded-md bg-[#1a1f71] text-[9.5px] font-black italic tracking-tight text-white">VISA</span>
    );
  } else if (type === "MASTERCARD") {
    chip = (
      <span className="relative grid h-6 w-9 place-items-center rounded-md bg-[#111] ">
        <span className="absolute left-[9px] size-3.5 rounded-full bg-[#eb001b]" />
        <span className="absolute right-[9px] size-3.5 rounded-full bg-[#f79e1b] mix-blend-screen" />
      </span>
    );
  } else {
    chip = (
      <span className="grid h-6 w-9 place-items-center rounded-md bg-[#eef0ef] text-ink-3">
        <CreditCard className="size-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      {chip}
      {last4 && <span className="font-mono text-[13px] text-ink-2">•{last4}</span>}
    </span>
  );
}
