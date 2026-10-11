import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Gavel } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { sqlOne } from "@/lib/db";
import { resolveDisputes } from "@/lib/gateway";
import { fmtDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Callout, Card, CardHeader, DefinitionList, PageHeader, StatusBadge } from "@/components/ui";
import { DisputeResponse } from "./response";

export const metadata = { title: "Dispute" };

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  await resolveDisputes();
  const d = await sqlOne(
    `SELECT d.*, p.payment_id, p.order_id, p.order_desc, p.currency, p.masked_card, p.sender_email, p.paid_at, m.name AS merchant_name, m.user_id
       FROM disputes d JOIN payments p ON p.id = d.payment_ref JOIN merchants m ON m.id = p.merchant_ref WHERE d.id = $1`,
    [Number(id)],
  );
  if (!d || (d.user_id !== user.id && user.role !== "admin")) notFound();

  return (
    <>
      <Link href="/portal/disputes" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> Disputes
      </Link>
      <PageHeader
        eyebrow={`Dispute #${d.id}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {formatMoney(d.amount, d.currency)} <StatusBadge status={d.status} className="text-[13px]" />
          </span>
        }
        description={`${d.reason_code} · ${d.reason}`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {d.status === "needs_response" && (
            <Card>
              <CardHeader title="Respond to the dispute" description={`Deadline: ${fmtDateTime(d.due_at)}`} />
              <div className="p-5 sm:p-6">
                <DisputeResponse id={d.id} />
              </div>
            </Card>
          )}
          {d.status === "under_review" && (
            <Callout tone="info" title="The bank is reviewing your evidence">
              <Clock className="mr-1 inline size-4" /> In the sandbox this takes about 2 minutes. Refresh the page to see the decision.
            </Callout>
          )}
          {d.status === "won" && (
            <Callout tone="success" title="You won this dispute">
              The bank accepted your evidence. The money stays with you.
            </Callout>
          )}
          {d.status === "lost" && (
            <Callout tone="danger" title="Dispute lost">
              The amount was returned to the customer (chargeback). Tip: next time describe the order and delivery in detail.
            </Callout>
          )}
          {d.evidence && (
            <Card>
              <CardHeader title="Your evidence" description={d.evidence_at ? `Submitted ${fmtDateTime(d.evidence_at)}` : undefined} />
              <p className="whitespace-pre-wrap px-6 py-5 text-[14px] text-ink-2">{d.evidence}</p>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader title="Disputed payment" actions={<Gavel className="size-5 text-ink-3" />} />
          <DefinitionList
            items={[
              [
                "Payment ID",
                <Link key="p" href={`/portal/payments/${d.payment_id}`} className="font-mono font-semibold text-brand-700 hover:underline">
                  {d.payment_id}
                </Link>,
              ],
              ["Order", d.order_id],
              ["Description", d.order_desc],
              ["Merchant", d.merchant_name],
              ["Card", d.masked_card],
              ["Customer", d.sender_email],
              ["Paid", fmtDateTime(d.paid_at)],
              ["Opened", fmtDateTime(d.created_at)],
              ["Resolved", d.resolved_at ? fmtDateTime(d.resolved_at) : ""],
            ]}
          />
        </Card>
      </div>
    </>
  );
}
