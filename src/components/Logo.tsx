import { BRAND } from "@/lib/brand";

export function LogoMark({ size = 32, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="9" fill={inverted ? "#0b2a21" : "#c8f16b"} />
      <path
        d="M8 23h5v-5h5v-5h5V8"
        fill="none"
        stroke={inverted ? "#c8f16b" : "#0b2a21"}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mark + wordmark. `tone="light"` for dark backgrounds. */
export function Logo({ tone = "dark", size = 30 }: { tone?: "dark" | "light"; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} inverted={tone === "dark"} />
      <span className={`text-[19px] font-extrabold tracking-tight ${tone === "light" ? "text-white" : "text-forest-900"}`}>
        {BRAND.name.replace(/Pay$/, "")}
        <span className={tone === "light" ? "text-lime-300" : "text-brand-600"}>Pay</span>
      </span>
    </span>
  );
}
