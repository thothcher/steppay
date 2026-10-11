import Link from "next/link";
import { ArrowRight, Globe, Server, ShieldAlert, Store } from "lucide-react";
import { getScope, sp } from "@/lib/portal";
import { getBaseUrl } from "@/lib/url";
import { TEST_CARDS, formatCardNumber } from "@/lib/testcards";
import * as S from "@/lib/snippets";
import { ButtonLink, Callout, Card, EmptyState, PageHeader, cn } from "@/components/ui";
import { CodeTabs, KeyField, Code } from "@/components/ui/client";

export const metadata = { title: "Integration" };

export default async function IntegrationPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const { merchants, selected } = await getScope();
  const base = await getBaseUrl();

  if (merchants.length === 0) {
    return (
      <>
        <PageHeader title="Integration" />
        <Card>
          <EmptyState
            icon={Store}
            title="Create a merchant first"
            description="You need a merchant ID and a secret key before you can connect your website."
            action={<ButtonLink href="/portal/activation">Start activation</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  const m = merchants.find((x) => x.id === Number(sp(params, "merchant"))) ?? selected ?? merchants[0];
  const v = { base, merchantId: String(m.merchant_id), secret: m.secret_key };

  return (
    <>
      <PageHeader
        title="Integration"
        description="Everything you need to accept payments on your website — the code below already contains your keys."
        actions={
          merchants.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {merchants.map((x) => (
                <Link
                  key={x.id}
                  href={`/portal/integration?merchant=${x.id}`}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[13px] font-semibold",
                    x.id === m.id ? "border-brand-500 bg-brand-50 text-brand-800" : "border-line-strong bg-white text-ink-2 hover:border-ink-3",
                  )}
                >
                  {x.name}
                </Link>
              ))}
            </div>
          )
        }
      />

      <ol className="space-y-8">
        <Step n={1} title="Copy your keys" text={`Merchant “${m.name}”. The Merchant ID is public; the secret key must stay on your server.`}>
          <Card className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-3">
            <KeyField label="Merchant ID" value={String(m.merchant_id)} />
            <KeyField label="Secret key" value={m.secret_key} secret />
            <KeyField label="API base URL" value={`${base}/api`} />
          </Card>
        </Step>

        <Step n={2} title="Choose your integration" text="Pick the one that matches your project. You can switch later.">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-brand-500 bg-white p-5">
              <div className="flex items-center gap-2 text-[15px] font-bold">
                <Globe className="size-5 text-brand-600" /> A. Frontend only
              </div>
              <p className="mt-1 text-[13.5px] text-ink-2">
                Plain HTML/CSS/JS or React on Netlify, GitHub Pages… Add one script tag and call <code className="font-mono">StepPay.checkout()</code>
                . Best for your first project.
              </p>
            </div>
            <div className="rounded-2xl border border-line-strong bg-white p-5">
              <div className="flex items-center gap-2 text-[15px] font-bold">
                <Server className="size-5 text-forest-700" /> B. With a backend (how real shops do it)
              </div>
              <p className="mt-1 text-[13.5px] text-ink-2">
                Node.js, PHP or Python calculates the price, signs the request with the secret key and receives a callback when the customer pays.
              </p>
            </div>
          </div>
          {!m.allow_unsigned && (
            <Callout tone="warning" className="mt-4" title="Frontend payments are OFF for this merchant">
              Option A will fail with error 1001. Turn on “Allow frontend payments” in{" "}
              <Link href={`/portal/merchants/${m.id}`}>merchant settings</Link>.
            </Callout>
          )}
        </Step>

        <Step n={3} title="A. Frontend only — paste this into your pages">
          <CodeTabs
            storageKey="steppay-frontend"
            tabs={[
              { label: "Shop page (redirect)", lang: "html", code: S.htmlShop(v), title: "index.html" },
              { label: "Cart + popup", lang: "html", code: S.htmlCart(v), title: "cart.html" },
              { label: "Thank-you page", lang: "html", code: S.thankYouPage(v), title: "thank-you.html" },
              { label: "React", lang: "jsx", code: S.reactSnippet(v), title: "PayButton.jsx" },
            ]}
          />
          <Callout tone="info" className="mt-4">
            Remember: <b>amount is in minor units</b> — 25.50 GEL is <code className="font-mono">2550</code>. Use{" "}
            <code className="font-mono">StepPay.toMinor(25.5)</code>.
          </Callout>
        </Step>

        <Step n={4} title="B. With a backend — sign requests on your server">
          <div className="space-y-4">
            <Code code={S.envFile(v)} lang="bash" title=".env" />
            <CodeTabs
              storageKey="steppay-backend"
              tabs={[
                { label: "Node.js + Express", lang: "js", code: S.nodeServer(v), title: "server.js" },
                { label: "Browser part", lang: "html", code: S.nodeFrontend(), title: "public/index.html" },
                { label: "PHP config", lang: "php", code: S.phpConfig(v), title: "config.php" },
                { label: "PHP checkout", lang: "php", code: S.phpCheckout(), title: "checkout.php" },
                { label: "PHP callback", lang: "php", code: S.phpCallback(), title: "callback.php" },
                { label: "Python + Flask", lang: "python", code: S.pythonFlask(v), title: "app.py" },
              ]}
            />
            <Callout tone="warning" title="Callbacks need a public URL">
              <ShieldAlert className="mr-1 inline size-4" /> StepPay runs on the internet and cannot reach{" "}
              <code className="font-mono">localhost</code>. While developing, rely on the <code className="font-mono">response_url</code> redirect or
              the status API, or expose your server with a tunnel (ngrok, cloudflared).
            </Callout>
          </div>
        </Step>

        <Step n={5} title="Test with these cards" text="Any future expiry date, any CVV.">
          <Card className="divide-y divide-line">
            {TEST_CARDS.map((c) => (
              <div key={c.number} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
                <span className={cn("size-2 rounded-full", c.result === "approved" ? "bg-brand-500" : "bg-red-500")} />
                <code className="font-mono text-[14px] tnum">{formatCardNumber(c.number)}</code>
                <span className="text-[13.5px] text-ink-2">{c.label}</span>
              </div>
            ))}
          </Card>
        </Step>

        <Step n={6} title="See the result">
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/portal/payments">
              Payments <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/portal/logs" variant="secondary">
              Developer logs
            </ButtonLink>
            <ButtonLink href={`/portal/playground?merchant=${m.id}`} variant="secondary">
              API playground
            </ButtonLink>
            <ButtonLink href="/docs" variant="ghost">
              Full documentation
            </ButtonLink>
          </div>
        </Step>
      </ol>
    </>
  );
}

function Step({ n, title, text, children }: { n: number; title: string; text?: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-1 gap-4 md:grid-cols-[44px_1fr]">
      <span className="grid size-11 place-items-center rounded-full bg-forest-900 text-[15px] font-extrabold text-lime-300">{n}</span>
      <div className="min-w-0">
        <h2 className="text-[19px] font-extrabold tracking-tight">{title}</h2>
        {text && <p className="mt-0.5 text-[14px] text-ink-2">{text}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </li>
  );
}
