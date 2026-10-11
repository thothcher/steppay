import { Lock, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { cn } from "@/components/ui";

/** Page chrome around the hosted checkout (full page or compact for the SDK modal). */
export function CheckoutFrame({ merchant, embed, children }: { merchant: { name: string; url: string }; embed: boolean; children: React.ReactNode }) {
  const initials = merchant.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let host = "";
  try {
    host = merchant.url ? new URL(merchant.url).host : "";
  } catch {}

  return (
    <div className={cn("flex min-h-dvh flex-col", embed ? "bg-white" : "bg-canvas")}>
      <div className="bg-forest-900 py-1.5 text-center text-[12px] font-semibold text-lime-200">
        <ShieldCheck className="mr-1.5 inline size-3.5 -translate-y-px" />
        TEST MODE — use test cards only, no real money is charged
      </div>
      {!embed && (
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
            <span className="grid size-9 place-items-center rounded-xl bg-forest-900 text-[13px] font-bold text-lime-300">{initials || "?"}</span>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold text-ink">{merchant.name}</div>
              {host && <div className="truncate text-[12px] text-ink-3">{host}</div>}
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
              <Lock className="size-3.5" /> Secure checkout
            </span>
          </div>
        </header>
      )}
      <main className={cn("mx-auto w-full flex-1", embed ? "max-w-xl px-4 py-5" : "max-w-5xl px-4 py-8 sm:px-6 sm:py-12")}>{children}</main>
      <footer className="pb-6 pt-2 text-center text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          Powered by <LogoMark size={16} inverted /> <b className="text-ink-2">{BRAND.name}</b> · educational sandbox
        </span>
      </footer>
    </div>
  );
}
