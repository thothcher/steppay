import Link from "next/link";
import { Callout } from "@/components/ui";
import { Code } from "@/components/ui/client";
import { DocHeader, Step, Steps } from "../parts";
import { docVars } from "../vars";

export const metadata = { title: "Payment links" };

export default async function PaymentLinksDocs() {
  const v = await docVars();
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Integrate"
        title="Payment links (no code)"
        lead="A payment link is a ready checkout page with a fixed price — or one where the customer types the amount. Share it in a chat, an e-mail, a QR code or put it behind a button."
      />
      <Steps>
        <Step title="Create the link">
          <p>
            Portal → <Link href="/portal/links">Payment solutions → Payment links</Link>. Choose the merchant, write what you sell, set the price (or
            tick “Customer chooses the amount”) and optionally a redirect URL.
          </p>
        </Step>
        <Step title="Share it">
          <p>
            Every link looks like <code>{v.base}/pay/AbC123xYz9</code>. Press <b>Copy link</b>, or <b>Copy HTML button</b> to get a ready button:
          </p>
          <Code
            lang="html"
            code={`<a href="${v.base}/pay/AbC123xYz9"
   style="display:inline-block;padding:12px 22px;border-radius:12px;background:#0e8653;color:#fff;font:600 15px system-ui,sans-serif;text-decoration:none">
  Pay 45.00 GEL
</a>`}
          />
        </Step>
        <Step title="See who paid">
          <p>
            Link payments appear in Payments with integration type <b>Payment link</b> and <code>merchant_data</code> = <code>link:&lt;id&gt;</code>.
            The links page shows how many times each link was paid.
          </p>
        </Step>
      </Steps>
      <Callout tone="info" title="When to use links">
        Donations, a single product, tickets, paying an invoice. For a shop with a cart use the <Link href="/docs/sdk">SDK</Link> or the{" "}
        <Link href="/docs/api">API</Link> — the price changes with every order.
      </Callout>
    </div>
  );
}
