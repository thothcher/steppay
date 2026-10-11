import Link from "next/link";
import { ArrowRight, Globe, Link2, Server } from "lucide-react";
import { Callout } from "@/components/ui";
import { DocHeader } from "./parts";

export const metadata = { title: "How StepPay works" };

const FLOW = [
  { who: "Customer", text: "clicks “Pay” in your shop", tone: "bg-white" },
  { who: "Your website", text: "creates a payment: merchant_id, amount, order_id (+ signature)", tone: "bg-white" },
  { who: "StepPay", text: "returns a checkout_url — you send the customer there", tone: "bg-lime-100" },
  { who: "Customer", text: "enters a test card on the StepPay checkout (and the 3-D Secure code)", tone: "bg-lime-100" },
  { who: "StepPay", text: "sends the result to your server_callback_url and redirects to your response_url", tone: "bg-lime-100" },
  { who: "Your website", text: "shows “Thank you!” and marks the order as paid", tone: "bg-white" },
];

export default function DocsIntro() {
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Getting started"
        title="How StepPay works"
        lead="StepPay is a sandbox payment gateway for IT Step Academy. It behaves like a real bank payment provider (it follows the same structure as Flitt), but only accepts test cards — so you can build a real checkout into your online restaurant or shop without any risk."
      />

      <h2>The payment flow</h2>
      <p>Every online card payment — on StepPay or on a real provider — follows the same six steps:</p>
      <ol className="!list-none !pl-0">
        {FLOW.map((f, i) => (
          <li key={i} className="!my-0 flex items-stretch gap-3">
            <div className="flex flex-col items-center">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-900 text-[13px] font-extrabold text-lime-300">
                {i + 1}
              </span>
              {i < FLOW.length - 1 && <span className="w-0.5 flex-1 bg-line-strong" />}
            </div>
            <div className={`mb-3 flex-1 rounded-2xl border border-line px-4 py-3 ${f.tone}`}>
              <div className="text-[12.5px] font-bold uppercase tracking-wide text-ink-3">{f.who}</div>
              <div className="text-[15px] text-ink">{f.text}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="!mt-0 text-[13.5px] text-ink-3">
        Steps on a green background happen on StepPay. The customer never types card data into your website.
      </p>

      <h2>Key words you need to know</h2>
      <table>
        <tbody>
          <tr>
            <th>Merchant</th>
            <td>Your shop / website in StepPay. Each merchant has its own keys. One student can have many merchants (restaurant, clothing shop…).</td>
          </tr>
          <tr>
            <th>
              <code>merchant_id</code>
            </th>
            <td>Public 7-digit number that identifies your merchant. Safe to use in the browser.</td>
          </tr>
          <tr>
            <th>Secret key</th>
            <td>
              Private key (<code>sk_test_…</code>) used to <Link href="/docs/signature">sign</Link> requests. Keep it on the server, never commit it
              to GitHub.
            </td>
          </tr>
          <tr>
            <th>
              <code>order_id</code>
            </th>
            <td>
              Your own unique ID of the order, e.g. <code>order_1042</code>. A new one for every payment.
            </td>
          </tr>
          <tr>
            <th>
              <code>amount</code>
            </th>
            <td>
              Price in <strong>minor units</strong> (tetri / cents) as a whole number: 25.50 GEL → <code>2550</code>.
            </td>
          </tr>
          <tr>
            <th>Checkout</th>
            <td>
              The StepPay page where the customer enters the card. You get its address as <code>checkout_url</code>.
            </td>
          </tr>
          <tr>
            <th>
              <code>response_url</code>
            </th>
            <td>Your page where the customer returns after paying (e.g. thank-you.html). The result is added to the URL.</td>
          </tr>
          <tr>
            <th>
              <code>server_callback_url</code>
            </th>
            <td>Your server endpoint that StepPay calls (POST) with the result. The reliable way to know an order is paid.</td>
          </tr>
          <tr>
            <th>Order statuses</th>
            <td>
              <code>created</code> → <code>processing</code> (3-D Secure) → <code>approved</code> or <code>declined</code>. Unpaid orders become{" "}
              <code>expired</code>; refunded ones <code>reversed</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Choose your integration</h2>
      <div className="not-prose grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: Link2, title: "Payment link", text: "No code. Create a link in the portal and share it.", href: "/docs/payment-links" },
          { icon: Globe, title: "JavaScript SDK", text: "Frontend only. One script tag + StepPay.checkout().", href: "/docs/sdk" },
          { icon: Server, title: "Server API", text: "Node.js / PHP / Python with signatures and callbacks.", href: "/docs/api" },
        ].map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group block rounded-2xl border border-line bg-white p-4 !no-underline transition hover:border-brand-300"
          >
            <c.icon className="size-6 text-brand-700" />
            <div className="mt-2 text-[15px] font-bold text-ink">{c.title}</div>
            <div className="mt-0.5 text-[13.5px] font-normal text-ink-2">{c.text}</div>
          </Link>
        ))}
      </div>

      <Callout tone="info" className="mt-8" title="New here? Follow the step-by-step guide">
        It takes you from creating an account to a working “Pay” button in your shop in about 15 minutes.{" "}
        <Link href="/docs/quick-start">
          Open the guide <ArrowRight className="inline size-4" />
        </Link>
      </Callout>
    </div>
  );
}
