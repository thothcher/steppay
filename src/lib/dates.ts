export const TZ = process.env.APP_TIMEZONE || "Asia/Tbilisi";

function parts(date: Date) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour === "24" ? "00" : p.hour, i: p.minute, s: p.second };
}

/** YYYY-MM-DD in the app time zone */
export function isoDay(date: Date = new Date()): string {
  const p = parts(date);
  return `${p.y}-${p.m}-${p.d}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Every day between from and to, inclusive. */
export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}

/** "09 Sep 2026" */
export function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

/** "02:35:47" */
export function fmtTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const p = parts(new Date(date));
  return `${p.h}:${p.i}:${p.s}`;
}

export function fmtDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return `${fmtDate(date)}, ${fmtTime(date)}`;
}

/** Flitt-style order_time: "21.01.2026 15:22:04" */
export function orderTime(date: Date): string {
  const p = parts(date);
  return `${p.d}.${p.m}.${p.y} ${p.h}:${p.i}:${p.s}`;
}

/** "Oct 05" for chart ticks */
export function shortDay(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(day + "T12:00:00Z")).toUpperCase();
}

export function timeAgo(date: Date | string): string {
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** Validated date range from search params with a default length. */
export function readRange(sp: { from?: string; to?: string }, defaultDays = 7): { from: string; to: string } {
  const valid = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const to = valid(sp.to) ?? isoDay();
  let from = valid(sp.from) ?? addDays(to, -(defaultDays - 1));
  if (from > to) from = to;
  return { from, to };
}
