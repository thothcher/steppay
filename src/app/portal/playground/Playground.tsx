"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ExternalLink, RefreshCw, Send, Search } from "lucide-react";
import { Field, Input, Select, buttonClass, cn } from "@/components/ui";
import { Code } from "@/components/ui/client";

type M = { id: number; name: string; merchant_id: number; secret_key: string; allow_unsigned: boolean };

async function sha1(text: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function values(params: Record<string, string | number>) {
  return Object.keys(params)
    .filter((k) => k !== "signature")
    .sort()
    .map((k) => params[k])
    .filter((v) => v !== "" && v !== undefined && v !== null)
    .map(String);
}

const newOrderId = () => `order_${Date.now().toString().slice(-8)}`;

export function Playground({ merchants, initial, base }: { merchants: M[]; initial: number; base: string }) {
  const [mid, setMid] = useState(initial);
  const m = merchants.find((x) => x.id === mid) ?? merchants[0];
  const [form, setForm] = useState({
    order_id: "",
    order_desc: "Pizza Margherita × 2",
    amount: "3700",
    currency: "GEL",
    response_url: "",
    server_callback_url: "",
    sender_email: "",
    preauth: "",
  });
  const [signRequest, setSignRequest] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [statusResponse, setStatusResponse] = useState<Record<string, unknown> | null>(null);

  useEffect(() => setForm((f) => ({ ...f, order_id: f.order_id || newOrderId() })), []);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { merchant_id: m.merchant_id };
    for (const [k, v] of Object.entries(form)) if (v !== "") p[k] = k === "amount" && /^\d+$/.test(v) ? Number(v) : v;
    return p;
  }, [form, m.merchant_id]);

  const sigString = [m.secret_key, ...values(params)].join("|");
  const maskedString = ["**********", ...values(params)].join("|");

  useEffect(() => {
    let alive = true;
    sha1(sigString).then((s) => alive && setSignature(s));
    return () => {
      alive = false;
    };
  }, [sigString]);

  const request = signRequest ? { ...params, signature } : params;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function send() {
    setBusy(true);
    setResponse(null);
    setStatusResponse(null);
    try {
      const res = await fetch("/api/checkout/url", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-StepPay-Client": "playground" },
        body: JSON.stringify({ request }),
      });
      setResponse(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    const p = { merchant_id: m.merchant_id, order_id: form.order_id };
    const sig = await sha1([m.secret_key, ...values(p)].join("|"));
    const res = await fetch("/api/status/order_id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: { ...p, signature: sig } }),
    });
    setStatusResponse(await res.json());
  }

  const r = (response?.response ?? null) as Record<string, string> | null;

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <Field label="Merchant" htmlFor="m">
          <Select id="m" value={m.id} onChange={(e) => setMid(Number(e.target.value))}>
            {merchants.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.merchant_id})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="order_id" htmlFor="order_id" hint="Must be unique for every new payment.">
          <div className="flex gap-2">
            <Input id="order_id" value={form.order_id} onChange={set("order_id")} className="font-mono" />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, order_id: newOrderId() }))}
              className={buttonClass("secondary", "md", "px-3")}
              aria-label="New order id"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </Field>
        <Field label="order_desc" htmlFor="order_desc">
          <Input id="order_desc" value={form.order_desc} onChange={set("order_desc")} />
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field
            label="amount (minor units)"
            htmlFor="amount"
            hint={/^\d+$/.test(form.amount) ? `= ${(Number(form.amount) / 100).toFixed(2)} ${form.currency}` : "Whole number, e.g. 2550"}
          >
            <Input id="amount" value={form.amount} onChange={set("amount")} className="font-mono" inputMode="numeric" />
          </Field>
          <Field label="currency" htmlFor="currency">
            <Select id="currency" value={form.currency} onChange={set("currency")}>
              <option>GEL</option>
              <option>USD</option>
              <option>EUR</option>
            </Select>
          </Field>
        </div>
        <Field label="response_url (optional)" htmlFor="response_url">
          <Input id="response_url" value={form.response_url} onChange={set("response_url")} placeholder={`${base}/docs/test-cards`} />
        </Field>
        <Field label="server_callback_url (optional)" htmlFor="server_callback_url">
          <Input
            id="server_callback_url"
            value={form.server_callback_url}
            onChange={set("server_callback_url")}
            placeholder="https://webhook.site/your-id"
          />
        </Field>
        <Field label="sender_email (optional)" htmlFor="sender_email">
          <Input id="sender_email" value={form.sender_email} onChange={set("sender_email")} placeholder="customer@example.com" />
        </Field>
        <label className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
          <input
            type="checkbox"
            checked={form.preauth === "Y"}
            onChange={(e) => setForm((f) => ({ ...f, preauth: e.target.checked ? "Y" : "" }))}
            className="size-4 accent-brand-600"
          />
          preauth = Y (hold money, capture later)
        </label>
        <label className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
          <input type="checkbox" checked={signRequest} onChange={(e) => setSignRequest(e.target.checked)} className="size-4 accent-brand-600" />
          Sign the request (server style)
        </label>
        <button type="button" onClick={send} disabled={busy} className={buttonClass("primary", "lg", "w-full")}>
          <Send className="size-4" /> {busy ? "Sending…" : "Send request"}
        </button>
      </div>

      <div className="min-w-0 space-y-5">
        <section>
          <h2 className="mb-2 text-[15px] font-bold">1. Signature string</h2>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <p className="text-[13px] text-ink-2">Secret key, then the values of all non-empty parameters sorted by name, joined with “|”:</p>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f6f8f6] px-3 py-2.5">
              <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-ink">{showSecret ? sigString : maskedString}</code>
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="rounded-lg p-1 text-ink-3 hover:bg-black/5 hover:text-ink"
                aria-label="Toggle secret"
              >
                {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="mt-3 text-[13px] text-ink-2">sha1( … ) =</p>
            <code
              className={cn(
                "mt-1 block break-all rounded-xl px-3 py-2.5 font-mono text-[13px]",
                signRequest ? "bg-lime-100 text-forest-900" : "bg-[#f6f8f6] text-ink-3 line-through",
              )}
            >
              {signature || "…"}
            </code>
            {!signRequest && (
              <p className="mt-2 text-[12.5px] text-ink-3">
                Unsigned requests work only when “Allow frontend payments” is on ({m.allow_unsigned ? "it is ON" : "it is OFF — expect error 1001"}).
              </p>
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-[15px] font-bold">2. Request — POST {base}/api/checkout/url</h2>
          <Code code={JSON.stringify({ request }, null, 2)} lang="json" title="JSON body" />
        </section>
        {response && (
          <section className="animate-fade-in">
            <h2 className="mb-2 text-[15px] font-bold">3. Response</h2>
            <Code code={JSON.stringify(response, null, 2)} lang="json" title={r?.response_status === "success" ? "✓ success" : "✗ failure"} />
            {r?.response_status === "success" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={r.checkout_url} target="_blank" rel="noreferrer" className={buttonClass("primary")}>
                  <ExternalLink className="size-4" /> Open checkout & pay
                </a>
                <button type="button" onClick={checkStatus} className={buttonClass("secondary")}>
                  <Search className="size-4" /> Check order status
                </button>
                <button type="button" onClick={() => setForm((f) => ({ ...f, order_id: newOrderId() }))} className={buttonClass("ghost")}>
                  <RefreshCw className="size-4" /> New order_id
                </button>
              </div>
            )}
          </section>
        )}
        {statusResponse && (
          <section className="animate-fade-in">
            <h2 className="mb-2 text-[15px] font-bold">4. POST /api/status/order_id</h2>
            <Code code={JSON.stringify(statusResponse, null, 2)} lang="json" title="order status" />
          </section>
        )}
      </div>
    </div>
  );
}
