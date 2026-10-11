import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { addDays, isoDay } from "@/lib/dates";
import { qs } from "@/lib/portal";
import { CURRENCIES } from "@/lib/brand";
import { Button, Input, Select, cn } from "@/components/ui";

/**
 * One row of filters above the content (GET form, works without JavaScript).
 * Presets first, then the custom range, then optional search / status / currency.
 */
export function FilterBar({
  basePath,
  from,
  to,
  keep = {},
  currency,
  search,
  searchPlaceholder = "Search order ID, payment ID, description or e-mail",
  status,
  statusOptions,
}: {
  basePath: string;
  from: string;
  to: string;
  keep?: Record<string, string>;
  currency?: string;
  search?: string;
  searchPlaceholder?: string;
  status?: string;
  statusOptions?: { value: string; label: string }[];
}) {
  const today = isoDay();
  const presets = [
    { label: "Today", from: today, to: today },
    { label: "7 days", from: addDays(today, -6), to: today },
    { label: "30 days", from: addDays(today, -29), to: today },
    { label: "90 days", from: addDays(today, -89), to: today },
  ];
  const keepAll = { ...keep, ...(currency ? { currency } : {}), ...(search ? { q: search } : {}), ...(status ? { status } : {}) };

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = p.from === from && p.to === to;
          return (
            <Link
              key={p.label}
              href={`${basePath}${qs({ ...keepAll, from: p.from, to: p.to })}`}
              scroll={false}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                active ? "bg-forest-900 text-white" : "bg-white text-ink-2 ring-1 ring-line-strong hover:text-ink hover:ring-ink-3",
              )}
            >
              {p.label}
            </Link>
          );
        })}
      </div>
      <form method="get" action={basePath} className="flex flex-col gap-2 lg:flex-row lg:items-center">
        {Object.entries(keep).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <div className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line-strong bg-white px-3">
          <input
            type="date"
            name="from"
            defaultValue={from}
            max={today}
            className="bg-transparent text-[14px] text-ink outline-none"
            aria-label="From"
          />
          <ArrowRight className="size-4 shrink-0 text-ink-3" />
          <input type="date" name="to" defaultValue={to} max={today} className="bg-transparent text-[14px] text-ink outline-none" aria-label="To" />
        </div>
        {search !== undefined && (
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input name="q" defaultValue={search} placeholder={searchPlaceholder} className="pl-10" />
          </div>
        )}
        {statusOptions && (
          <Select name="status" defaultValue={status} className="lg:w-44" aria-label="Status">
            <option value="">All statuses</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        )}
        {currency !== undefined && (
          <Select name="currency" defaultValue={currency} className="lg:w-28" aria-label="Currency">
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        )}
        <Button type="submit" className={search !== undefined ? "lg:w-28" : ""}>
          {search !== undefined ? "Search" : "Apply"}
        </Button>
      </form>
    </div>
  );
}
