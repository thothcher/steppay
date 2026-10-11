"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { buttonClass, cn } from "./index";
import { highlight, type Lang } from "@/lib/highlight";

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return { copied, copy };
}

export function CopyButton({ value, label, className, dark }: { value: string; label?: string; className?: string; dark?: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-semibold transition-colors",
        dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-ink-3 hover:bg-black/5 hover:text-ink",
        className,
      )}
      aria-label={label ? undefined : "Copy"}
    >
      {copied ? <Check className="size-3.5 text-brand-500" /> : <Copy className="size-3.5" />}
      {label && (copied ? "Copied" : label)}
    </button>
  );
}

/** A read-only value with copy (and optional reveal for secrets). */
export function KeyField({ label, value, secret, hint }: { label: string; value: string; secret?: boolean; hint?: string }) {
  const [shown, setShown] = useState(!secret);
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-ink">{label}</div>
      <div className="flex items-center gap-1 rounded-xl border border-line-strong bg-[#f8faf8] py-1 pl-3.5 pr-1">
        <code className="min-w-0 flex-1 truncate font-mono text-[13.5px] text-ink">{shown ? value : "•".repeat(Math.min(value.length, 28))}</code>
        {secret && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-black/5 hover:text-ink"
            aria-label={shown ? "Hide" : "Show"}
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
        <CopyButton value={value} label="Copy" />
      </div>
      {hint && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingText,
  ...rest
}: {
  children: React.ReactNode;
  variant?: Parameters<typeof buttonClass>[0];
  size?: Parameters<typeof buttonClass>[1];
  className?: string;
  pendingText?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} type="submit" disabled={pending || rest.disabled} className={buttonClass(variant, size, className)}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** Button that opens a modal dialog. */
export function Dialog({
  trigger,
  title,
  description,
  children,
  triggerClassName,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  triggerClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  return (
    <>
      <button type="button" className={triggerClassName ?? buttonClass("secondary", "md")} onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(520px,calc(100vw-32px))] rounded-2xl border border-line bg-white p-0 shadow-pop backdrop:bg-forest-950/40 backdrop:backdrop-blur-[2px]"
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13.5px] text-ink-2">{description}</p>}
          </div>
          <button type="button" onClick={close} className="rounded-lg p-1 text-ink-3 hover:bg-black/5 hover:text-ink" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{typeof children === "function" ? children(close) : children}</div>
      </dialog>
    </>
  );
}

/** Dark code block with syntax highlighting and copy button. */
export function Code({ code, lang = "js", title, className }: { code: string; lang?: Lang; title?: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-forest-950 ring-1 ring-black/5", className)}>
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
        <span className="font-mono text-[12px] text-white/50">{title ?? lang}</span>
        <CopyButton value={code} label="Copy" dark />
      </div>
      <pre className="code-block thin-scroll overflow-x-auto px-4 py-3.5 text-[#e6efe9]">
        <code dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} />
      </pre>
    </div>
  );
}

/** Several code samples behind tabs (e.g. JavaScript / PHP / Python). */
export function CodeTabs({
  tabs,
  storageKey = "steppay-lang",
}: {
  tabs: { label: string; lang: Lang; code: string; title?: string }[];
  storageKey?: string;
}) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const idx = tabs.findIndex((t) => t.label === saved);
      if (idx >= 0) setActive(idx);
    } catch {}
  }, [storageKey, tabs]);
  const tab = tabs[active] ?? tabs[0];
  return (
    <div className="overflow-hidden rounded-2xl bg-forest-950 ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2 border-b border-white/8 pl-2 pr-3">
        <div className="thin-scroll flex overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                setActive(i);
                try {
                  localStorage.setItem(storageKey, t.label);
                } catch {}
              }}
              className={cn(
                "relative whitespace-nowrap px-3 py-2.5 text-[12.5px] font-semibold transition-colors",
                i === active ? "text-lime-300" : "text-white/50 hover:text-white/80",
              )}
            >
              {t.label}
              {i === active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-lime-300" />}
            </button>
          ))}
        </div>
        <CopyButton value={tab.code} label="Copy" dark />
      </div>
      {tab.title && <div className="border-b border-white/8 px-4 py-1.5 font-mono text-[11.5px] text-white/40">{tab.title}</div>}
      <pre className="code-block thin-scroll max-h-[560px] overflow-auto px-4 py-3.5 text-[#e6efe9]">
        <code dangerouslySetInnerHTML={{ __html: highlight(tab.code, tab.lang) }} />
      </pre>
    </div>
  );
}
