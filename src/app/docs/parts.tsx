// Building blocks for documentation pages.
import { cn } from "@/components/ui";

export function DocHeader({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: React.ReactNode }) {
  return (
    <header className="mb-8">
      <div className="text-[13px] font-bold uppercase tracking-wider text-brand-700">{eyebrow}</div>
      <h1 className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight text-ink sm:text-[40px]">{title}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-2">{lead}</p>
    </header>
  );
}

/** Numbered steps with a vertical line. */
export function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="relative my-6 space-y-8 border-l-2 border-line pl-8 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <li id={id} className="relative scroll-mt-24 [counter-increment:step]">
      <span className="absolute -left-[49px] top-0 grid size-8 place-items-center rounded-full bg-forest-900 text-[14px] font-extrabold text-lime-300 before:content-[counter(step)]" />
      <h3 className="!mt-0 text-[18px] font-bold text-ink">{title}</h3>
      <div className="mt-2 space-y-4">{children}</div>
    </li>
  );
}

export type Param = { name: string; type: string; required?: boolean; description: React.ReactNode; example?: string };

export function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-line bg-white">
      {params.map((p, i) => (
        <div key={p.name} className={cn("grid gap-1 px-4 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-4", i > 0 && "border-t border-line")}>
          <div>
            <code className="font-mono text-[13.5px] font-semibold text-ink">{p.name}</code>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12px]">
              <span className="text-ink-3">{p.type}</span>
              {p.required ? <span className="font-bold text-red-600">required</span> : <span className="text-ink-3">optional</span>}
            </div>
          </div>
          <div className="text-[14px] leading-relaxed text-ink-2">
            {p.description}
            {p.example && (
              <div className="mt-1 text-[12.5px] text-ink-3">
                Example: <code className="font-mono text-ink-2">{p.example}</code>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <div className="my-4 flex flex-wrap items-center gap-2 rounded-xl bg-forest-950 px-4 py-3 font-mono text-[14px]">
      <span className="rounded-md bg-lime-300 px-2 py-0.5 text-[12px] font-bold text-forest-900">{method}</span>
      <span className="break-all text-white">{path}</span>
    </div>
  );
}
