import Link from "next/link";
import { ArrowLeft, Code, CreditCard, PartyPopper } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { sqlOne } from "@/lib/db";
import { merchantStatus, ownedMerchant } from "@/lib/portal";
import { fmtDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { ButtonLink, Callout, Card, CardHeader, DefinitionList, PageHeader, StatusBadge } from "@/components/ui";
import { KeyField } from "@/components/ui/client";
import { DangerZone, MerchantSettingsForm, RegenerateSecret } from "../forms";

export const metadata = { title: "Merchant settings" };

export default async function MerchantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await requireUser();
  const m = await ownedMerchant(user, Number(id));
  const stats = await sqlOne<{ total: number; approved: number; volume: number; currency: string | null }>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status IN ('approved','reversed'))::int AS approved,
            COALESCE(sum(amount) FILTER (WHERE status IN ('approved','reversed') AND currency = 'GEL'), 0)::float8 AS volume,
            NULL AS currency
       FROM payments WHERE merchant_ref = $1`,
    [m.id],
  );
  const status = merchantStatus(m);

  return (
    <>
      <Link href="/portal/merchants" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> My Businesses
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {m.name} <StatusBadge status={status} className="text-[13px]" />
          </span>
        }
        description={m.url || "No website URL yet"}
        actions={
          <>
            <ButtonLink href={`/portal/payments`} variant="secondary">
              <CreditCard className="size-4" /> Payments
            </ButtonLink>
            <ButtonLink href={`/portal/integration?merchant=${m.id}`}>
              <Code className="size-4" /> Integration guide
            </ButtonLink>
          </>
        }
      />

      {created && (
        <Callout tone="success" title="Merchant created — your keys are ready!" className="mb-6">
          Copy the <b>merchant_id</b> and <b>secret key</b> below, then open the{" "}
          <Link href={`/portal/integration?merchant=${m.id}`}>integration guide</Link> for code you can paste into your website.
        </Callout>
      )}
      {status === "pending" && (
        <Callout tone="info" title="Test payments already work" className="mb-6">
          Finish <Link href={`/portal/activation?company=${m.company_id ?? ""}`}>activation</Link> to receive settlements (payouts to your IBAN).
        </Callout>
      )}
      {status === "disabled" && (
        <Callout tone="warning" title="This merchant is disabled" className="mb-6">
          New payments are rejected with error 1003. Enable it in the danger zone below.
        </Callout>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="API keys"
              description="Use these in your website code. Never put the secret key in frontend code or a public GitHub repo."
              actions={<RegenerateSecret id={m.id} />}
            />
            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
              <KeyField label="Merchant ID (public)" value={String(m.merchant_id)} hint="Safe to use in the browser." />
              <KeyField label="Secret key (private)" value={m.secret_key} secret hint="Server only — used to calculate the signature." />
            </div>
          </Card>

          <Card>
            <CardHeader title="General settings" />
            <div className="p-5 sm:p-6">
              <MerchantSettingsForm
                merchant={{ id: m.id, name: m.name, url: m.url, callback_url: m.callback_url, allow_unsigned: m.allow_unsigned }}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Overview" />
            <DefinitionList
              items={[
                ["Company", m.company_name],
                ["Status", <StatusBadge key="s" status={status} />],
                ["Created", fmtDate(m.created_at)],
                ["Processing fee", `${(m.fee_bps / 100).toFixed(2)} %`],
                [
                  "Payments",
                  <span key="p" className="tnum">
                    {stats?.total ?? 0} total · {stats?.approved ?? 0} approved
                  </span>,
                ],
                ["Approved (GEL)", formatMoney(stats?.volume ?? 0, "GEL")],
              ]}
            />
          </Card>
          {stats?.total === 0 && (
            <div className="rounded-2xl bg-forest-900 p-5 text-white">
              <PartyPopper className="mb-3 size-6 text-lime-300" />
              <div className="text-[15px] font-bold">Make your first test payment</div>
              <p className="mt-1 text-[13.5px] text-white/70">Try the API playground — no code needed. Then add the SDK to your shop.</p>
              <ButtonLink href={`/portal/playground?merchant=${m.id}`} variant="lime" size="sm" className="mt-4">
                Open playground
              </ButtonLink>
            </div>
          )}
          <Card>
            <CardHeader title="Danger zone" />
            <div className="p-5">
              <DangerZone id={m.id} active={m.active} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
