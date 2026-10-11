// Server-safe UI building blocks. Interactive pieces live in ./client.tsx
import Link from "next/link";
import { Info, TriangleAlert, CircleCheck, CircleX } from "lucide-react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Buttons ──────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "danger" | "lime" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-900/10",
  secondary: "bg-white text-ink border border-line-strong hover:border-ink-3 hover:bg-[#fafbfa]",
  ghost: "text-ink-2 hover:bg-black/5 hover:text-ink",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  lime: "bg-lime-300 text-forest-900 hover:bg-lime-400",
  dark: "bg-forest-900 text-white hover:bg-forest-800",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none select-none",
    variants[variant],
    sizes[size],
    extra,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  external,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={buttonClass(variant, size, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────────────
export function Card({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("rounded-2xl border border-line bg-white shadow-card", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[13px] font-semibold text-ink-3">{eyebrow}</div>}
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[14.5px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Callouts ─────────────────────────────────────────────────────────────────
const calloutStyles = {
  info: { box: "bg-lime-50 border-lime-200", icon: Info, iconClass: "text-forest-700" },
  warning: { box: "bg-amber-50 border-amber-200", icon: TriangleAlert, iconClass: "text-amber-600" },
  success: { box: "bg-brand-50 border-brand-200", icon: CircleCheck, iconClass: "text-brand-600" },
  danger: { box: "bg-red-50 border-red-200", icon: CircleX, iconClass: "text-red-600" },
};

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof calloutStyles;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const s = calloutStyles[tone];
  const Icon = s.icon;
  return (
    <div className={cn("flex gap-3 rounded-2xl border px-4 py-3.5 text-[14px]", s.box, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", s.iconClass)} aria-hidden />
      <div className="min-w-0 text-ink-2 [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline">
        {title && <div className="font-bold text-ink">{title}</div>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
      </div>
    </div>
  );
}

// ── Badges ───────────────────────────────────────────────────────────────────
const badgeTones = {
  green: "bg-[#e5f6ec] text-[#11683b]",
  red: "bg-[#fdeceb] text-[#b42318]",
  gray: "bg-[#eef0ef] text-[#4f5b56]",
  amber: "bg-[#fff3d6] text-[#94560a]",
  violet: "bg-[#efeafe] text-[#5a3cc0]",
  blue: "bg-[#e7f0ff] text-[#2453c2]",
  lime: "bg-lime-100 text-forest-800",
};

export function Badge({ tone = "gray", children, className }: { tone?: keyof typeof badgeTones; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12.5px] font-semibold whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusMap: Record<string, { tone: keyof typeof badgeTones; label: string }> = {
  created: { tone: "amber", label: "Created" },
  processing: { tone: "amber", label: "Processing" },
  approved: { tone: "green", label: "Approved" },
  declined: { tone: "red", label: "Declined" },
  expired: { tone: "gray", label: "Expired" },
  reversed: { tone: "violet", label: "Reversed" },
  needs_response: { tone: "red", label: "Needs response" },
  under_review: { tone: "amber", label: "Under review" },
  won: { tone: "green", label: "Won" },
  lost: { tone: "gray", label: "Lost" },
  activated: { tone: "green", label: "Activated" },
  pending: { tone: "gray", label: "Pending Onboarding" },
  disabled: { tone: "red", label: "Disabled" },
  settled: { tone: "green", label: "Settled" },
  scheduled: { tone: "amber", label: "Scheduled" },
  on_hold: { tone: "gray", label: "On hold" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = statusMap[status] ?? { tone: "gray" as const, label: status };
  return (
    <Badge tone={s.tone} className={className}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {s.label}
    </Badge>
  );
}

// ── Forms ────────────────────────────────────────────────────────────────────
export const inputClass =
  "block w-full h-10 rounded-xl border border-line-strong bg-white px-3.5 text-[14px] text-ink placeholder:text-ink-3/80 transition-colors hover:border-ink-3 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-canvas disabled:text-ink-3";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "h-auto min-h-24 py-2.5 leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        inputClass,
        "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%237c8a83' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9",
        props.className,
      )}
    />
  );
}

// ── Tabs (links) ─────────────────────────────────────────────────────────────
export function Tabs({ items }: { items: { label: React.ReactNode; href: string; active: boolean; count?: number }[] }) {
  return (
    <nav className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-line px-1" aria-label="Tabs">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-[3px] px-3 pb-3 pt-1 text-[14.5px] font-semibold transition-colors",
            t.active ? "border-brand-500 text-ink" : "border-transparent text-ink-3 hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className={cn("rounded-full px-1.5 py-px text-[11.5px] tnum", t.active ? "bg-brand-100 text-brand-800" : "bg-black/5 text-ink-3")}>
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

// ── Tables ───────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-[14px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-line bg-[#f6f8f6] px-4 py-3 text-[12.5px] font-bold whitespace-nowrap text-ink first:rounded-l-xl last:rounded-r-xl",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("border-b border-line px-4 py-3.5 align-middle", className)}>
      {children}
    </td>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-lime-100 text-forest-800">
        <Icon className="size-7" />
      </div>
      <h3 className="text-[16px] font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-[14px] text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-4 text-[13px] text-ink-3">
      <span>
        Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink href={makeHref(page - 1)} variant="secondary" size="sm">
            Previous
          </ButtonLink>
        ) : (
          <span className={buttonClass("secondary", "sm", "opacity-40")}>Previous</span>
        )}
        {page < pages ? (
          <ButtonLink href={makeHref(page + 1)} variant="secondary" size="sm">
            Next
          </ButtonLink>
        ) : (
          <span className={buttonClass("secondary", "sm", "opacity-40")}>Next</span>
        )}
      </div>
    </div>
  );
}

/** Key / value rows for detail pages. */
export function DefinitionList({ items }: { items: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4 sm:px-6">
          <dt className="text-[13px] font-medium text-ink-3">{k}</dt>
          <dd className="min-w-0 break-words text-[14px] text-ink">{v || <span className="text-ink-3">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
