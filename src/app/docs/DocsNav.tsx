"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export const DOCS_NAV = [
  {
    title: "Getting started",
    items: [
      { href: "/docs", label: "How StepPay works" },
      { href: "/docs/quick-start", label: "Step-by-step guide" },
      { href: "/docs/test-cards", label: "Test cards" },
    ],
  },
  {
    title: "Integrate",
    items: [
      { href: "/docs/sdk", label: "JavaScript SDK (frontend)" },
      { href: "/docs/api", label: "API reference" },
      { href: "/docs/signature", label: "Signature" },
      { href: "/docs/callbacks", label: "Redirects & callbacks" },
      { href: "/docs/payment-links", label: "Payment links (no code)" },
    ],
  },
  {
    title: "Next steps",
    items: [
      { href: "/docs/going-live", label: "Going live with a real provider" },
      { href: "/docs/lecturers", label: "For lecturers" },
    ],
  },
];

export function DocsNav() {
  const path = usePathname();
  return (
    <nav className="space-y-6">
      {DOCS_NAV.map((g) => (
        <div key={g.title}>
          <div className="mb-2 px-3 text-[11.5px] font-bold uppercase tracking-wider text-ink-3">{g.title}</div>
          <ul className="space-y-0.5">
            {g.items.map((i) => {
              const active = path === i.href;
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors",
                      active ? "bg-lime-200 font-semibold text-forest-900" : "text-ink-2 hover:bg-black/[0.04] hover:text-ink",
                    )}
                  >
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsMobileNav() {
  const path = usePathname();
  const all = DOCS_NAV.flatMap((g) => g.items);
  return (
    <div className="thin-scroll -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:hidden">
      {all.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1",
            path === i.href ? "bg-forest-900 text-white ring-forest-900" : "bg-white text-ink-2 ring-line-strong",
          )}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}

export function DocsPager() {
  const path = usePathname();
  const all = DOCS_NAV.flatMap((g) => g.items);
  const idx = all.findIndex((i) => i.href === path);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  return (
    <div className="mt-14 grid grid-cols-2 gap-3 border-t border-line pt-6">
      <div>
        {prev && (
          <Link href={prev.href} className="block rounded-2xl border border-line bg-white p-4 hover:border-brand-300">
            <div className="text-[12px] font-semibold text-ink-3">← Previous</div>
            <div className="text-[14.5px] font-bold text-ink">{prev.label}</div>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link href={next.href} className="block rounded-2xl border border-line bg-white p-4 text-right hover:border-brand-300">
            <div className="text-[12px] font-semibold text-ink-3">Next →</div>
            <div className="text-[14.5px] font-bold text-ink">{next.label}</div>
          </Link>
        )}
      </div>
    </div>
  );
}
