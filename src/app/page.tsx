import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CreditCard,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Terminal,
  Webhook,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { getBaseUrl } from "@/lib/url";
import { BRAND } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";
import { Code } from "@/components/ui/client";

const FEATURES = [
  { icon: CreditCard, title: "Hosted checkout", text: "A real-looking payment page with test cards, 3-D Secure codes, declines and receipts." },
  {
    icon: LayoutDashboard,
    title: "Merchant portal",
    text: "Sales charts, payments, refunds, settlements, disputes and CSV reports — like a real bank portal.",
  },
  { icon: ShieldCheck, title: "Signatures", text: "Requests are signed with SHA-1 and a secret key, exactly the way production gateways work." },
  { icon: Webhook, title: "Callbacks & redirects", text: "Your server receives signed POST callbacks; customers return to your thank-you page." },
  { icon: Terminal, title: "Developer logs", text: "Every API request and callback is logged with the full body — mistakes explain themselves." },
  { icon: GraduationCap, title: "Lecturer panel", text: "One academy, many students: groups, progress, payments and password resets." },
];

export default async function Landing() {
  const user = await getUser();
  const base = await getBaseUrl();

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[14px] font-semibold text-ink-2 md:flex">
            <a href="#how" className="hover:text-ink">
              How it works
            </a>
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <Link href="/docs" className="hover:text-ink">
              Docs
            </Link>
          </nav>
          <div className="flex-1" />
          {user ? (
            <ButtonLink href="/portal/home" size="sm">
              Open portal <ArrowRight className="size-4" />
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className="text-[14px] font-semibold text-ink-2 hover:text-ink">
                Sign in
              </Link>
              <ButtonLink href="/register" size="sm">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-forest-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute -right-32 -top-40 size-[560px] rounded-full bg-lime-300/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold text-lime-200 ring-1 ring-white/15">
              <GraduationCap className="size-4" /> Made for IT Step Academy students
            </span>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-[56px]">
              Real payments flow.
              <br />
              <span className="text-lime-300">Test money.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/75">
              {BRAND.name} is a sandbox payment gateway for your online restaurant, shop or booking site. Get a merchant ID and secret key, add a Pay
              button, and watch orders arrive in your own merchant dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={user ? "/portal/home" : "/register"} variant="lime" size="lg">
                {user ? "Open my portal" : "Create free account"} <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/docs/quick-start" size="lg" className="bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15">
                <BookOpen className="size-4" /> Step-by-step guide
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-white/70">
              {["No real money", "Same structure as Flitt", "Works with plain HTML"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-lime-300" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Hero visual: checkout card + dashboard card */}
          <div className="relative mx-auto mb-16 w-full max-w-[460px] sm:mb-32 lg:mb-28">
            <div className="rounded-3xl bg-white p-6 text-ink shadow-pop">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-forest-900 text-[12px] font-bold text-lime-300">PS</span>
                <div>
                  <div className="text-[14px] font-bold">Pizza Step</div>
                  <div className="text-[12px] text-ink-3">pizza-step.netlify.app</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3">
                  <Lock className="size-3.5" /> Secure
                </span>
              </div>
              <div className="mt-5 text-[13px] text-ink-3">Pizza Margherita × 2, Lemonade</div>
              <div className="text-[36px] font-extrabold tracking-tight">41.00 GEL</div>
              <div className="mt-4 rounded-xl border border-line-strong px-3.5 py-3 font-mono text-[14px] tracking-wider">4242 4242 4242 4242</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line-strong px-3.5 py-3 font-mono text-[14px]">12/30</div>
                <div className="rounded-xl border border-line-strong px-3.5 py-3 font-mono text-[14px]">•••</div>
              </div>
              <div className="mt-4 rounded-xl bg-brand-600 py-3 text-center text-[15px] font-bold text-white">Pay 41.00 GEL</div>
            </div>
            <div className="absolute -bottom-[118px] -left-6 hidden w-[250px] rounded-2xl bg-white p-4 text-ink shadow-pop sm:block lg:-left-16">
              <div className="flex items-center justify-between text-[12px] font-semibold text-ink-3">
                Total Sales <span className="rounded-md bg-[#e5f6ec] px-1.5 py-0.5 text-[11px] font-bold text-[#11683b]">+12</span>
              </div>
              <div className="mt-1 text-[22px] font-extrabold tracking-tight">1,284.50 GEL</div>
              <svg viewBox="0 0 220 56" className="mt-2 w-full" aria-hidden>
                <path
                  d="M0 48 L30 42 L60 44 L90 30 L120 34 L150 20 L180 24 L220 6"
                  fill="none"
                  stroke="#0e8653"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path d="M0 48 L30 42 L60 44 L90 30 L120 34 L150 20 L180 24 L220 6 L220 56 L0 56 Z" fill="#0e8653" fillOpacity="0.1" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-[13px] font-bold uppercase tracking-wider text-brand-700">How it works</div>
          <h2 className="mt-2 text-[32px] font-extrabold tracking-tight sm:text-[38px]">From zero to a working checkout in three steps</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              n: 1,
              title: "Create your merchant",
              text: "Register, fill in the activation form and receive your merchant_id and secret key instantly.",
            },
            {
              n: 2,
              title: "Add the Pay button",
              text: "Paste one script tag and StepPay.checkout() — or sign requests on your Node.js / PHP / Python server.",
            },
            {
              n: 3,
              title: "Pay with a test card",
              text: "Use 4242 4242 4242 4242, come back to your thank-you page and see the order in your dashboard.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl border border-line bg-canvas p-6">
              <span className="grid size-10 place-items-center rounded-full bg-forest-900 text-[15px] font-extrabold text-lime-300">{s.n}</span>
              <h3 className="mt-4 text-[18px] font-bold">{s.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code */}
      <section className="bg-canvas">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wider text-brand-700">For developers</div>
            <h2 className="mt-2 text-[32px] font-extrabold tracking-tight">Ten lines of code. Really.</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
              Start with the JavaScript SDK on a static site. When you are ready, move to signed server requests and callbacks — the same steps you
              will use with a real bank later.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/docs/sdk" variant="dark">
                SDK docs
              </ButtonLink>
              <ButtonLink href="/docs/api" variant="secondary">
                API reference
              </ButtonLink>
            </div>
          </div>
          <Code
            lang="html"
            title="index.html"
            code={`<script src="${base}/sdk/steppay.js"></script>

<button onclick="pay()">Pay 41.00 GEL</button>

<script>
  function pay() {
    StepPay.checkout({
      merchant_id: 1234567,      // from your portal
      amount: 4100,              // 41.00 GEL in tetri
      currency: "GEL",
      order_desc: "Pizza Margherita × 2, Lemonade",
      response_url: location.origin + "/thank-you.html",
    });
  }
</script>`}
          />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-[13px] font-bold uppercase tracking-wider text-brand-700">Features</div>
          <h2 className="mt-2 text-[32px] font-extrabold tracking-tight sm:text-[38px]">Everything a real payment provider has</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-line p-6 transition hover:border-brand-200 hover:shadow-card">
              <span className="grid size-11 place-items-center rounded-2xl bg-lime-100 text-forest-800">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-[17px] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-forest-900 px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -bottom-32 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-lime-300/20 blur-3xl" />
          <FlaskConical className="relative mx-auto size-10 text-lime-300" />
          <h2 className="relative mt-4 text-[30px] font-extrabold tracking-tight sm:text-[38px]">Your shop deserves a real checkout</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[16px] text-white/70">
            Free for every IT Step student. Create an account, get your keys and make your first test payment today.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={user ? "/portal/home" : "/register"} variant="lime" size="lg">
              {user ? "Open my portal" : "Get my API keys"} <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/docs" size="lg" className="bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15">
              Read the docs
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-8 text-[13px] text-ink-3 sm:px-6">
          <Logo size={24} />
          <span>Educational sandbox — no real payments are processed.</span>
          <div className="flex-1" />
          <Link href="/docs" className="hover:text-ink">
            Docs
          </Link>
          <Link href="/docs/test-cards" className="hover:text-ink">
            Test cards
          </Link>
          <Link href="/docs/lecturers" className="hover:text-ink">
            For lecturers
          </Link>
        </div>
      </footer>
    </div>
  );
}
