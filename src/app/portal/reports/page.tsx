import Link from "next/link";
import { CreditCard, Download, Landmark, Scale, Terminal, Undo2 } from "lucide-react";
import { getScope, sp } from "@/lib/portal";
import { readRange } from "@/lib/dates";
import { Card, PageHeader, buttonClass } from "@/components/ui";
import { FilterBar } from "@/components/portal/FilterBar";

export const metadata = { title: "Reports center" };

const REPORTS = [
  { type: "payments", icon: CreditCard, title: "Payments report", text: "Every order with status, card, customer and response code." },
  { type: "settlements", icon: Landmark, title: "Settlements report", text: "Daily payouts per merchant: gross, refunds, fees and net." },
  { type: "refunds", icon: Undo2, title: "Refunds report", text: "All full and partial refunds, including chargebacks." },
  { type: "disputes", icon: Scale, title: "Disputes report", text: "Chargebacks with reason codes, deadlines and outcomes." },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { selected } = await getScope();
  const { from, to } = readRange({ from: sp(params, "from"), to: sp(params, "to") }, 30);

  return (
    <>
      <PageHeader
        title="Reports center"
        description={`Download CSV files (open them in Excel or Google Sheets). Scope: ${selected ? selected.name : "all merchants"} — change it in the top bar.`}
      />
      <FilterBar basePath="/portal/reports" from={from} to={to} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.type} className="flex items-start gap-4 p-5 sm:p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime-100 text-forest-800">
              <r.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-bold">{r.title}</h2>
              <p className="mt-0.5 text-[13.5px] text-ink-2">{r.text}</p>
              <a href={`/api/portal/export?type=${r.type}&from=${from}&to=${to}`} className={buttonClass("secondary", "sm", "mt-4")}>
                <Download className="size-4" /> Download CSV
              </a>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-forest-900 text-lime-300">
          <Terminal className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-bold">Developer logs</h2>
          <p className="text-[13.5px] text-ink-2">
            Every API request your code sent and every callback we delivered — the best place to debug errors.
          </p>
        </div>
        <Link href="/portal/logs" className={buttonClass("primary")}>
          Open logs
        </Link>
      </Card>
    </>
  );
}
