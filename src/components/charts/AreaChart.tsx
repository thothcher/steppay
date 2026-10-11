"use client";

import { useEffect, useRef, useState } from "react";

type Point = { day: string; value: number; count: number };

const SERIES = "#0e8653"; // brand-600, validated ≥3:1 on white
const GRID = "#e7ebe8";
const AXIS = "#cfd7d1";
const MUTED = "#7c8a83";

function niceMax(v: number) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

const compact = (v: number) => Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const money = (minor: number) => (minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const tick = (day: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(new Date(day + "T12:00:00Z")).toUpperCase();
const longDay = (day: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(day + "T12:00:00Z"),
  );

/** Single-series area chart with crosshair tooltip (values in minor units). */
export function AreaChart({
  data,
  currency,
  label,
  countLabel = "payments",
}: {
  data: Point[];
  currency: string;
  label: string;
  countLabel?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 210;
  const pad = { l: 46, r: 14, t: 12, b: 30 };
  const W = Math.max(width, 280);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(...data.map((d) => d.value / 100), 0));
  const n = data.length;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (minor: number) => pad.t + ih - (minor / 100 / max) * ih;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = n > 0 ? `${line} L${x(n - 1).toFixed(1)},${pad.t + ih} L${x(0).toFixed(1)},${pad.t + ih} Z` : "";
  const yTicks = [0, max / 2, max];
  const maxLabels = Math.max(2, Math.floor(iw / 64));
  const step = Math.max(1, Math.ceil(n / maxLabels));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round(((px - pad.l) / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
    if (e.key === "Escape") setHover(null);
  };

  const h = hover !== null ? data[hover] : null;
  const last = data[n - 1];

  return (
    <div ref={wrap} className="relative w-full select-none">
      {width > 0 && (
        <svg
          width={W}
          height={H}
          role="img"
          aria-label={`${label} per day, ${currency}`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t * 100)} y2={y(t * 100)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} />
              <text x={pad.l - 10} y={y(t * 100)} dy="0.35em" textAnchor="end" fontSize={11.5} fill={MUTED} className="tnum">
                {compact(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % step === 0 || i === n - 1 ? (
              <text
                key={d.day}
                x={x(i)}
                y={H - 8}
                textAnchor={i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"}
                fontSize={11}
                fill={MUTED}
                fontWeight={500}
              >
                {tick(d.day)}
              </text>
            ) : null,
          )}
          <path d={area} fill={SERIES} fillOpacity={0.1} />
          <path d={line} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {last && <circle cx={x(n - 1)} cy={y(last.value)} r={4} fill={SERIES} stroke="#fff" strokeWidth={2} />}
          {h && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={MUTED} strokeWidth={1} />
              <circle cx={x(hover)} cy={y(h.value)} r={5} fill={SERIES} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-[150px] rounded-xl border border-line bg-white px-3 py-2 shadow-pop"
          style={{
            left: Math.min(Math.max(x(hover) - 75, 0), W - 160),
          }}
        >
          <div className="text-[11.5px] font-medium text-ink-3">{longDay(h.day)}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES }} />
            <span className="text-[15px] font-bold text-ink tnum">
              {money(h.value)} {currency}
            </span>
          </div>
          <div className="mt-0.5 pl-5 text-[12px] text-ink-3">
            {h.count} {countLabel}
          </div>
        </div>
      )}
      {width === 0 && <div style={{ height: H }} />}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Amount ({currency})</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{d.day}</td>
              <td>{money(d.value)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
