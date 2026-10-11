// Horizontal bars for a small categorical breakdown (one series → one color).
export function BarList({ items, empty = "No data in this period" }: { items: { label: string; value: number; hint?: string }[]; empty?: string }) {
  const max = Math.max(...items.map((i) => i.value), 0);
  const total = items.reduce((s, i) => s + i.value, 0);
  if (items.length === 0 || total === 0) {
    return <div className="grid h-40 place-items-center text-[13.5px] text-ink-3">{empty}</div>;
  }
  return (
    <ul className="space-y-3.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="truncate font-semibold text-ink">{i.label}</span>
            <span className="shrink-0 text-ink-2 tnum">
              <b className="font-bold text-ink">{i.value}</b>
              <span className="ml-1.5 text-[12px] text-ink-3">{Math.round((i.value / total) * 100)}%</span>
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#eef2ef]">
            <div className="h-2.5 rounded-full bg-brand-600" style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} title={i.hint} />
          </div>
        </li>
      ))}
    </ul>
  );
}
