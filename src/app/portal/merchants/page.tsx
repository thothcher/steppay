import Link from "next/link";
import { Building2, ChevronRight, Plus, Search, Store } from "lucide-react";
import { getScope, merchantStatus, sp } from "@/lib/portal";
import { companiesOf } from "@/lib/merchants";
import { fmtDate } from "@/lib/dates";
import { ButtonLink, Card, EmptyState, Input, PageHeader, StatusBadge, Table, Tabs, Td, Th, Button } from "@/components/ui";

export const metadata = { title: "My Businesses" };

export default async function MerchantsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const tab = sp(params, "tab") === "companies" ? "companies" : "merchants";
  const q = sp(params, "q").trim().toLowerCase();
  const { user, merchants } = await getScope();
  const companies = await companiesOf(user.id);

  const list = q
    ? merchants.filter((m) => [m.name, m.url, String(m.merchant_id), m.company_name ?? ""].some((v) => v.toLowerCase().includes(q)))
    : merchants;

  return (
    <>
      <PageHeader title="My Businesses" description="Each merchant is one website or shop with its own API keys." />
      <Tabs
        items={[
          { label: "Merchants", href: "/portal/merchants", active: tab === "merchants", count: merchants.length },
          { label: "Companies", href: "/portal/merchants?tab=companies", active: tab === "companies", count: companies.length },
        ]}
      />

      {tab === "merchants" ? (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/portal/merchants/new" className="shrink-0">
              <Plus className="size-4" /> New merchant
            </ButtonLink>
            <form className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                <Input name="q" defaultValue={q} placeholder="Search by name, URL or merchant ID" className="pl-10" />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>

          {merchants.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No merchants yet"
              description="Create a merchant for your online shop or restaurant website to get your merchant ID and secret key."
              action={
                <ButtonLink href="/portal/activation">
                  <Plus className="size-4" /> Create your first merchant
                </ButtonLink>
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Merchant name</Th>
                  <Th>Merchant URL</Th>
                  <Th>Merchant ID</Th>
                  <Th>Company</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id} className="group hover:bg-[#fafbfa]">
                    <Td className="font-semibold">
                      <Link href={`/portal/merchants/${m.id}`} className="hover:text-brand-700">
                        {m.name}
                      </Link>
                    </Td>
                    <Td className="text-ink-2">{m.url ? <span className="break-all">{m.url}</span> : <span className="text-ink-3">—</span>}</Td>
                    <Td className="font-mono text-[13.5px] tnum">{m.merchant_id}</Td>
                    <Td className="text-ink-2">{m.company_name ?? "—"}</Td>
                    <Td>
                      <StatusBadge status={merchantStatus(m)} />
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/portal/merchants/${m.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-line-strong px-2.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:border-ink-3 hover:text-ink"
                      >
                        Settings <ChevronRight className="size-3.5" />
                      </Link>
                    </Td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <Td colSpan={6} className="py-10 text-center text-ink-3">
                      Nothing matches “{q}”.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card>
      ) : (
        <Card className="p-4 sm:p-5">
          {companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="A company is created during activation (step 1). It holds the director and bank account details."
              action={<ButtonLink href="/portal/activation">Start activation</ButtonLink>}
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Legal form</Th>
                  <Th>Tax ID</Th>
                  <Th>IBAN</Th>
                  <Th>Merchants</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-semibold">{c.name}</Td>
                    <Td className="text-ink-2">{c.legal_form}</Td>
                    <Td className="font-mono text-[13px]">{c.tax_id || "—"}</Td>
                    <Td className="font-mono text-[13px]">{c.iban ? `${c.iban.slice(0, 4)} •••• ${c.iban.slice(-4)}` : "—"}</Td>
                    <Td className="tnum">{c.merchants}</Td>
                    <Td>
                      <StatusBadge status={c.status === "activated" ? "activated" : "pending"} />
                    </Td>
                    <Td className="text-ink-2">{fmtDate(c.created_at)}</Td>
                    <Td className="text-right">
                      {c.status !== "activated" ? (
                        <ButtonLink href={`/portal/activation?company=${c.id}`} size="sm">
                          Continue activation
                        </ButtonLink>
                      ) : (
                        <ButtonLink href={`/portal/activation?company=${c.id}`} size="sm" variant="secondary">
                          View
                        </ButtonLink>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
