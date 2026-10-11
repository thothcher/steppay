import { Store } from "lucide-react";
import { getScope, sp } from "@/lib/portal";
import { getBaseUrl } from "@/lib/url";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { Playground } from "./Playground";

export const metadata = { title: "API playground" };

export default async function PlaygroundPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { merchants, selected } = await getScope();
  const base = await getBaseUrl();
  return (
    <>
      <PageHeader
        title="API playground"
        description="Build a payment request, watch the signature being calculated, send it and pay — without writing code."
      />
      {merchants.length === 0 ? (
        <Card>
          <EmptyState icon={Store} title="Create a merchant first" action={<ButtonLink href="/portal/activation">Start activation</ButtonLink>} />
        </Card>
      ) : (
        <Playground
          base={base}
          initial={Number(sp(params, "merchant")) || selected?.id || merchants[0].id}
          merchants={merchants.map((m) => ({
            id: m.id,
            name: m.name,
            merchant_id: m.merchant_id,
            secret_key: m.secret_key,
            allow_unsigned: m.allow_unsigned,
          }))}
        />
      )}
    </>
  );
}
