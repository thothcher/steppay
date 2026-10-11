import Link from "next/link";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-forest-900 p-12 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-lime-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-24 size-[460px] rounded-full bg-brand-500/25 blur-3xl" />

        <Link href="/" className="relative">
          <Logo tone="light" />
        </Link>

        <div className="relative mt-auto max-w-lg">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold text-lime-200 ring-1 ring-white/15">
            <ShieldCheck className="size-3.5" /> Sandbox · no real money ever moves
          </p>
          <h1 className="text-[40px] leading-[1.08] font-extrabold tracking-tight">
            Accept payments on your student projects — <span className="text-lime-300">the way real shops do.</span>
          </h1>
          <ul className="mt-8 space-y-3 text-[15px] text-white/80">
            {[
              "Get your merchant ID and secret key in one minute",
              "Hosted checkout, test cards and 3-D Secure",
              "Dashboard with orders, refunds, settlements and disputes",
              "Same API structure as real payment providers",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-lime-300" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Mini receipt card */}
        <div className="relative mt-12 w-[340px] rounded-2xl bg-white p-5 text-ink shadow-pop">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-3">Payment received</span>
            <span className="rounded-md bg-[#e5f6ec] px-2 py-0.5 text-[12px] font-bold text-[#11683b]">Approved</span>
          </div>
          <div className="mt-2 text-[30px] font-extrabold tracking-tight">48.50 GEL</div>
          <div className="mt-1 text-[13px] text-ink-3">Pizza Margherita × 2 · order_1042</div>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 font-mono text-[12px] text-ink-3">
            <span className="rounded bg-[#1a1f71] px-1.5 py-px text-[10px] font-bold text-white">VISA</span> 424242XXXXXX4242
          </div>
        </div>
        <p className="relative mt-auto pt-10 text-[12.5px] text-white/40">Educational project for IT Step Academy</p>
      </aside>

      {/* Form */}
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
