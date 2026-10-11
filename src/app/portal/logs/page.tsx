import { Terminal, Webhook } from "lucide-react";
import { getScope, qs, sp } from "@/lib/portal";
import { sql } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/dates";
import { Badge, Callout, Card, EmptyState, PageHeader, Pagination, Tabs } from "@/components/ui";
import { Code } from "@/components/ui/client";

export const metadata = { title: "Developer logs" };

const PER_PAGE = 30;

function pretty(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export default async function LogsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { user, merchantRef } = await getScope();
  const tab = sp(params, "tab") === "callbacks" ? "callbacks" : "api";
  const only = sp(params, "only") === "errors";
  const page = Math.max(1, Number(sp(params, "page")) || 1);
  const offset = (page - 1) * PER_PAGE;

  const api =
    tab === "api"
      ? await sql(
          `SELECT l.*, m.name AS merchant_name, count(*) OVER()::int AS total FROM api_logs l JOIN merchants m ON m.id = l.merchant_ref
            WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2) ${only ? "AND NOT l.success" : ""}
            ORDER BY l.created_at DESC LIMIT ${PER_PAGE} OFFSET ${offset}`,
          [user.id, merchantRef],
        )
      : [];
  const callbacks =
    tab === "callbacks"
      ? await sql(
          `SELECT c.*, p.order_id, p.payment_id, m.name AS merchant_name, count(*) OVER()::int AS total
             FROM callbacks c JOIN payments p ON p.id = c.payment_ref JOIN merchants m ON m.id = p.merchant_ref
            WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2) ${only ? "AND (c.http_status IS NULL OR c.http_status NOT BETWEEN 200 AND 299)" : ""}
            ORDER BY c.created_at DESC LIMIT ${PER_PAGE} OFFSET ${offset}`,
          [user.id, merchantRef],
        )
      : [];
  const total = (tab === "api" ? api[0]?.total : callbacks[0]?.total) ?? 0;

  return (
    <>
      <PageHeader
        title="Developer logs"
        description="Click a row to see the full request and response. Logs help you find mistakes in your integration."
      />
      <Tabs
        items={[
          { label: "API requests", href: `/portal/logs${qs({ only: only ? "errors" : "" })}`, active: tab === "api" },
          { label: "Server callbacks", href: `/portal/logs${qs({ tab: "callbacks", only: only ? "errors" : "" })}`, active: tab === "callbacks" },
        ]}
      />
      <div className="mb-4 flex gap-1.5">
        <a
          href={`/portal/logs${qs({ tab: tab === "api" ? "" : tab })}`}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${!only ? "bg-forest-900 text-white" : "bg-white text-ink-2 ring-1 ring-line-strong"}`}
        >
          All
        </a>
        <a
          href={`/portal/logs${qs({ tab: tab === "api" ? "" : tab, only: "errors" })}`}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold ${only ? "bg-forest-900 text-white" : "bg-white text-ink-2 ring-1 ring-line-strong"}`}
        >
          Errors only
        </a>
      </div>

      <Card>
        {tab === "api" ? (
          api.length === 0 ? (
            <EmptyState
              icon={Terminal}
              title="No API requests yet"
              description="Requests to /api/checkout/url, /api/status/order_id, /api/reverse/order_id and /api/capture/order_id appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {api.map((l) => {
                const response = JSON.parse(l.response_body)?.response ?? {};
                return (
                  <li key={l.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-[#fafbfa] sm:px-6">
                        <Badge tone={l.success ? "green" : "red"}>{l.success ? "success" : `error ${l.error_code}`}</Badge>
                        <span className="font-mono text-[13px] font-semibold text-ink">POST /api/{l.endpoint}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                          {l.success ? `${l.merchant_name}` : response.error_message}
                        </span>
                        <span className="text-[12.5px] text-ink-3 tnum">
                          {fmtDate(l.created_at)} {fmtTime(l.created_at)}
                        </span>
                      </summary>
                      <div className="space-y-3 border-t border-line bg-[#fafbfa] px-5 py-4 sm:px-6">
                        <div className="text-[12.5px] text-ink-3">Origin: {l.origin}</div>
                        {response.request_signature_string && (
                          <Callout tone="warning" title="How to fix an invalid signature">
                            We expected the string below (your secret key is hidden as stars). Build exactly the same string in your code: secret key
                            first, then the values of all non-empty parameters sorted by parameter name, joined with “|”. Then take SHA-1 of it.
                            <code className="mt-2 block break-all rounded-lg bg-white px-2.5 py-1.5 font-mono text-[12.5px] text-ink">
                              {response.request_signature_string}
                            </code>
                          </Callout>
                        )}
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          <Code code={pretty(l.request_body)} lang="json" title="Request (parameters you sent)" />
                          <Code code={pretty(l.response_body)} lang="json" title="Response" />
                        </div>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )
        ) : callbacks.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No callbacks yet"
            description="When a payment has a server_callback_url, every status change is POSTed to your server and logged here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {callbacks.map((c) => {
              const ok = c.http_status >= 200 && c.http_status < 300;
              return (
                <li key={c.id}>
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-[#fafbfa] sm:px-6">
                      <Badge tone={ok ? "green" : "red"}>{c.http_status ?? "failed"}</Badge>
                      <span className="text-[13px] font-semibold">{c.event}</span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink-2">{c.url}</span>
                      <span className="text-[12.5px] text-ink-3">{c.order_id}</span>
                      <span className="text-[12.5px] text-ink-3 tnum">
                        {fmtDate(c.created_at)} {fmtTime(c.created_at)}
                      </span>
                    </summary>
                    <div className="space-y-3 border-t border-line bg-[#fafbfa] px-5 py-4 sm:px-6">
                      {c.error && <Callout tone="danger">{c.error}</Callout>}
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <Code code={pretty(c.request_body)} lang="json" title="We sent (POST, application/json)" />
                        <Code
                          code={c.response_body || "(empty)"}
                          lang="text"
                          title={`Your server answered${c.http_status ? ` HTTP ${c.http_status}` : ""} in ${c.duration_ms} ms`}
                        />
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Pagination
        page={page}
        pages={Math.max(1, Math.ceil(total / PER_PAGE))}
        makeHref={(n) => `/portal/logs${qs({ tab: tab === "api" ? "" : tab, only: only ? "errors" : "", page: n })}`}
      />
    </>
  );
}
