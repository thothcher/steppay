import { CURRENCY_SYMBOL } from "./brand";

/** 2550 → "25.50" */
export function minorToMajor(amount: number): string {
  return (amount / 100).toFixed(2);
}

/** 2550, "GEL" → "25.50 ₾" style string with grouping. */
export function formatMoney(amount: number, currency: string, opts: { symbol?: boolean } = {}): string {
  const value = (amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts.symbol && CURRENCY_SYMBOL[currency]) return `${CURRENCY_SYMBOL[currency]}${value}`;
  return `${value} ${currency}`;
}

/** Compact for chart axes: 125000 (minor) → "1.3K" */
export function compactMajor(amountMinor: number): string {
  const v = amountMinor / 100;
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

/** "25.50" | "25,5" → 2550 (null when invalid) */
export function parseMajor(input: string): number | null {
  const clean = String(input ?? "")
    .trim()
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}
