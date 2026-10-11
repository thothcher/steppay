import Link from "next/link";
import { Check, ChevronRight, Code, Layers, Link2, Plus, FlaskConical } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { companiesOf } from "@/lib/merchants";
import { sp } from "@/lib/portal";
import { Card, PageHeader, cn, DefinitionList } from "@/components/ui";
import { SubmitButton } from "@/components/ui/client";
import { CompanyForm, DirectorForm, IbanForm } from "./forms";
import { activateCompany } from "./actions";

export const metadata = { title: "Activation" };

const STEPS = [
  { title: "Create merchant", sub: "Company information" },
  { title: "Director identification", sub: "Director verification" },
  { title: "IBAN adding", sub: "Settlement details" },
  { title: "Activation", sub: "Review & approve" },
];

export default async function ActivationPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const user = await requireUser();
  const companies = await companiesOf(user.id);
  const wantsNew = sp(params, "new") === "1";
  const requested = Number(sp(params, "company"));
  const edit = Number(sp(params, "edit"));

  const company = wantsNew
    ? null
    : (companies.find((c) => c.id === requested) ?? companies.find((c) => c.status !== "activated") ?? companies.at(-1) ?? null);

  const step = company ? Math.min(company.onboarding_step, 5) : 1;
  const viewStep = company && edit >= 1 && edit < step ? edit : step;
  const activated = company?.status === "activated";

  return (
    <>
      <PageHeader
        title="Complete registration of your business"
        actions={
          <div className="flex items-center gap-3">
            {companies.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/portal/activation?company=${c.id}`}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-[12.5px] font-semibold",
                      c.id === company?.id ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong text-ink-2 hover:border-ink-3",
                    )}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <span className="text-[14px] font-medium text-ink-2">Step {Math.min(step, 4)} of 4</span>
          </div>
        }
      />

      {/* Stepper */}
      <Card className="mb-6 overflow-x-auto px-6 py-6 sm:px-8">
        <ol className="grid min-w-[640px] grid-cols-4">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = step > n || activated;
            const current = !done && step === n;
            return (
              <li key={s.title} className="relative pr-4">
                <div className="flex items-center">
                  <span
                    className={cn(
                      "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      done && "border-brand-500 bg-brand-500 text-white",
                      current && "border-brand-500 bg-white",
                      !done && !current && "border-line-strong bg-white",
                    )}
                  >
                    {done ? <Check className="size-5 stroke-[3]" /> : current ? <span className="size-3 rounded-full bg-brand-500" /> : null}
                  </span>
                  {n < 4 && <span className={cn("mx-3 h-1 flex-1 rounded-full", step > n || activated ? "bg-brand-500" : "bg-line")} />}
                </div>
                <div className="mt-4 text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">Step {n}</div>
                {company && done && n < 4 && !activated ? (
                  <Link
                    href={`/portal/activation?company=${company.id}&edit=${n}`}
                    className="mt-0.5 block text-[16px] font-bold text-ink hover:text-brand-700"
                  >
                    {s.title}
                  </Link>
                ) : (
                  <div className="mt-0.5 text-[16px] font-bold text-ink">{s.title}</div>
                )}
                <div className="text-[13.5px] text-ink-3">{s.sub}</div>
              </li>
            );
          })}
        </ol>
      </Card>

      {activated ? (
        <Done company={company!} justActivated={sp(params, "done") === "1"} />
      ) : (
        <Card className="p-6 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Step {viewStep}</div>
            <h2 className="mb-1 text-[22px] font-extrabold tracking-tight text-ink">
              {viewStep === 1 && (company ? "Company information" : "Tell us about your business")}
              {viewStep === 2 && "Who is the director?"}
              {viewStep === 3 && "Where should we send your money?"}
              {viewStep === 4 && "You're almost there!"}
            </h2>
            <p className="mb-6 text-[14.5px] text-ink-2">
              {viewStep === 1 && "We create your company and your first merchant. You get API keys right after this step."}
              {viewStep === 2 && "Real payment providers verify the owner of every business (KYC). Here it is simulated."}
              {viewStep === 3 && "Approved payments are settled to this bank account every day, minus the processing fee."}
              {viewStep === 4 && "Review your details and submit. In the sandbox approval is instant."}
            </p>
            {viewStep === 1 && <CompanyForm company={company} />}
            {viewStep === 2 && company && <DirectorForm company={company} />}
            {viewStep === 3 && company && <IbanForm company={company} />}
            {viewStep === 4 && company && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-line">
                  <DefinitionList
                    items={[
                      ["Company", `${company.name} · ${company.legal_form}`],
                      ["Tax ID", company.tax_id],
                      ["Address", company.address],
                      ["Director", `${company.director_name} · ${company.director_personal_id}`],
                      [
                        "IBAN",
                        <span key="i" className="font-mono">
                          {company.iban}
                        </span>,
                      ],
                      ["Bank", `${company.bank_name} · ${company.account_holder}`],
                    ]}
                  />
                </div>
                <form action={activateCompany.bind(null, company.id)}>
                  <SubmitButton size="lg" pendingText="Submitting…">
                    Submit for approval
                  </SubmitButton>
                </form>
              </div>
            )}
          </div>
        </Card>
      )}

      {companies.length > 0 && (
        <div className="mt-6 text-center">
          <Link href="/portal/activation?new=1" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-700 hover:underline">
            <Plus className="size-4" /> Register another business
          </Link>
        </div>
      )}
    </>
  );
}

function Done({ company, justActivated }: { company: { id: number; name: string }; justActivated: boolean }) {
  const cards = [
    {
      icon: Code,
      title: "Integrate the API",
      text: "Copy ready code for HTML, Node.js, PHP or Python with your keys inside.",
      href: "/portal/integration",
    },
    { icon: Link2, title: "Create a payment link", text: "No code at all — share a link or add a Pay button to any page.", href: "/portal/links" },
    {
      icon: FlaskConical,
      title: "Try the API playground",
      text: "Build a request, see the signature and pay with a test card.",
      href: "/portal/playground",
    },
  ];
  return (
    <Card className="px-6 py-10 text-center sm:px-10">
      <div className="mx-auto grid size-16 animate-pop place-items-center rounded-full bg-brand-500 text-white">
        <Check className="size-8 stroke-[3]" />
      </div>
      <div className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Step 4</div>
      <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-ink">
        {justActivated ? "Congratulations, you're activated!" : `${company.name} is activated`}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-[15px] text-ink-2">
        Your business passed review. Approved payments are now settled to your bank account every day. Here is what to do next:
      </p>
      <div className="mx-auto mt-8 grid max-w-4xl gap-4 text-left md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group rounded-2xl border border-line bg-lime-50/50 p-5 transition hover:border-brand-300 hover:bg-lime-50"
          >
            <c.icon className="size-6 text-brand-700" />
            <div className="mt-3 text-[15px] font-bold text-ink">{c.title}</div>
            <p className="mt-1 text-[13.5px] text-ink-2">{c.text}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand-700">
              Get started <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
      <div className="mx-auto mt-6 flex max-w-4xl items-center gap-4 rounded-2xl bg-forest-900 p-5 text-left text-white">
        <Layers className="size-9 shrink-0 text-lime-300" />
        <div className="flex-1">
          <div className="font-bold">Build your shop page now</div>
          <p className="text-[13.5px] text-white/70">Follow the step-by-step guide: add a cart, a Pay button and a thank-you page to your project.</p>
        </div>
        <Link href="/docs/quick-start" className="shrink-0 rounded-xl bg-lime-300 px-4 py-2 text-[14px] font-bold text-forest-900 hover:bg-lime-400">
          Open guide
        </Link>
      </div>
    </Card>
  );
}
