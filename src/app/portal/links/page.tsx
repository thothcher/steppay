import { ExternalLink, Link2, Store } from "lucide-react";
import { getScope } from "@/lib/portal";
import { sql } from "@/lib/db";
import { getBaseUrl } from "@/lib/url";
import { formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/ui/client";
import { LinkControls, NewLinkForm } from "./forms";

export const metadata = { title: "Payment links" };

export default async function LinksPage() {
  const { user, merchants, merchantRef } = await getScope();
  const base = await getBaseUrl();
  const links = await sql(
    `SELECT l.*, m.name AS merchant_name,
            (SELECT count(*) FROM payments p WHERE p.merchant_ref = l.merchant_ref AND p.merchant_data = 'link:' || l.slug AND p.status IN ('approved','reversed'))::int AS paid,
            (SELECT COALESCE(sum(p.amount), 0) FROM payments p WHERE p.merchant_ref = l.merchant_ref AND p.merchant_data = 'link:' || l.slug AND p.status IN ('approved','reversed'))::float8 AS volume
       FROM payment_links l JOIN merchants m ON m.id = l.merchant_ref
      WHERE m.user_id = $1 AND ($2::int IS NULL OR m.id = $2)
      ORDER BY l.created_at DESC`,
    [user.id, merchantRef],
  );

  return (
    <>
      <PageHeader title="Payment links" description="No code needed: create a link, share it in a chat or put a “Pay” button on any website." />
      {merchants.length === 0 ? (
        <Card>
          <EmptyState icon={Store} title="Create a merchant first" action={<ButtonLink href="/portal/activation">Start activation</ButtonLink>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {links.length === 0 && (
              <Card>
                <EmptyState icon={Link2} title="No payment links yet" description="Create your first one with the form. It works immediately." />
              </Card>
            )}
            {links.map((l) => {
              const url = `${base}/pay/${l.slug}`;
              const button = `<a href="${url}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#0e8653;color:#fff;font:600 15px system-ui,sans-serif;text-decoration:none">Pay ${l.amount ? formatMoney(l.amount, l.currency) : "now"}</a>`;
              return (
                <Card key={l.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[16px] font-bold">{l.title}</h2>
                        {l.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Disabled</Badge>}
                      </div>
                      <p className="mt-0.5 text-[13.5px] text-ink-2">
                        {l.amount ? formatMoney(l.amount, l.currency) : `Customer chooses amount (${l.currency})`} · {l.merchant_name} · created{" "}
                        {fmtDate(l.created_at)}
                      </p>
                    </div>
                    <LinkControls id={l.id} active={l.active} />
                  </div>
                  <div className="mt-4 flex items-center gap-1 rounded-xl border border-line-strong bg-[#f8faf8] py-1 pl-3.5 pr-1">
                    <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{url}</code>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-1.5 text-ink-3 hover:bg-black/5 hover:text-ink"
                      aria-label="Open"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    <CopyButton value={url} label="Copy link" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[13px] text-ink-3">
                      {l.paid} paid · {formatMoney(l.volume, l.currency)}
                    </span>
                    <CopyButton value={button} label="Copy HTML button" />
                  </div>
                </Card>
              );
            })}
          </div>
          <Card className="xl:sticky xl:top-24">
            <CardHeader title="New payment link" />
            <div className="p-5 sm:p-6">
              <NewLinkForm merchants={merchants.map((m) => ({ id: m.id, name: m.name }))} defaultMerchant={merchantRef ?? undefined} />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
