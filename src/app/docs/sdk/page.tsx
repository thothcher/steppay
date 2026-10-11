import Link from "next/link";
import { Callout } from "@/components/ui";
import { Code, CodeTabs } from "@/components/ui/client";
import * as S from "@/lib/snippets";
import { DocHeader, ParamTable } from "../parts";
import { docVars } from "../vars";

export const metadata = { title: "JavaScript SDK" };

export default async function SdkDocs() {
  const v = await docVars();
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Integrate"
        title="JavaScript SDK"
        lead="One script tag gives your website a StepPay object. It creates the payment, opens the checkout (as a redirect or a popup) and reads the result on your thank-you page. No backend required."
      />

      <h2>Install</h2>
      <Code lang="html" code={`<script src="${v.base}/sdk/steppay.js"></script>`} />
      <p>
        The SDK works on any website — plain HTML, React, Vue, Angular. In React/Vite put the tag into <code>index.html</code> and use{" "}
        <code>window.StepPay</code>.
      </p>
      <Callout tone="info" title="Frontend payments must be allowed">
        The SDK sends requests without a signature (the secret key must never be in the browser). This works while <b>Allow frontend payments</b> is
        on in Merchant settings — it is on by default.
      </Callout>

      <h2 id="checkout">StepPay.checkout(options)</h2>
      <p>Creates a payment and shows the checkout. Returns a Promise.</p>
      <ParamTable
        params={[
          { name: "merchant_id", type: "number", required: true, description: "Your Merchant ID.", example: v.merchantId },
          { name: "amount", type: "integer", required: true, description: "Amount in minor units (tetri/cents).", example: "2550 (= 25.50)" },
          { name: "currency", type: "string", description: "GEL (default), USD or EUR." },
          {
            name: "order_desc",
            type: "string",
            required: true,
            description: "What the customer pays for. Shown on the checkout.",
            example: "Pizza Margherita × 2",
          },
          { name: "order_id", type: "string", description: "Your unique order ID. Generated automatically when missing.", example: "order_1042" },
          {
            name: "mode",
            type: "string",
            description: <>“redirect” (default) — go to the checkout page; “modal” — open the checkout in a popup on your page.</>,
          },
          {
            name: "response_url",
            type: "string",
            description: "Redirect mode: where the customer returns. Default: the current page.",
            example: "https://my-shop.netlify.app/thank-you.html",
          },
          { name: "sender_email", type: "string", description: "Customer e-mail (pre-filled on the checkout)." },
          {
            name: "merchant_data",
            type: "string | object",
            description: "Any extra data you want back in the result (e.g. cart ID). Objects are JSON-encoded.",
          },
          { name: "onSuccess(result)", type: "function", description: "Modal mode: payment approved." },
          { name: "onDecline(result)", type: "function", description: "Modal mode: payment declined." },
          { name: "onClose()", type: "function", description: "Modal mode: the customer closed the popup without finishing." },
          {
            name: "onError(error)",
            type: "function",
            description: "The payment could not be created (wrong merchant_id, amount…). error.code and error.message explain why.",
          },
        ]}
      />

      <h3>Redirect mode (default)</h3>
      <Code lang="html" title="index.html" code={S.htmlShop(v)} />

      <h3>Popup (modal) mode</h3>
      <p>The customer stays on your page — the checkout opens over it. Great for single-page apps and carts.</p>
      <Code lang="html" title="cart.html" code={S.htmlCart(v)} />

      <h3>React</h3>
      <Code lang="jsx" title="PayButton.jsx" code={S.reactSnippet(v)} />

      <h2 id="result">The result object</h2>
      <p>
        <code>onSuccess</code> / <code>onDecline</code> and <code>StepPay.parseResult()</code> give you the same object:
      </p>
      <Code
        lang="json"
        code={`{
  "approved": true,                // shortcut: order_status === "approved"
  "order_id": "order_1791742493456_ov53i",
  "order_status": "approved",      // approved | declined | expired | reversed
  "payment_id": 1013000027,
  "amount": 2550,
  "currency": "GEL",
  "masked_card": "555555XXXXXX4444",
  "card_type": "MASTERCARD",
  "response_code": "00",
  "response_description": "Approved",
  "signature": "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"
}`}
      />

      <h2 id="parse">StepPay.parseResult()</h2>
      <p>
        Use it on the page you passed as <code>response_url</code>. Returns <code>null</code> when the page was opened directly.
      </p>
      <Code lang="html" title="thank-you.html" code={S.thankYouPage(v)} />

      <h2 id="helpers">Helpers</h2>
      <CodeTabs
        tabs={[
          {
            label: "Helpers",
            lang: "js",
            code: `StepPay.toMinor(25.5);              // 2550
StepPay.formatAmount(2550, "GEL");  // "25.50 GEL"

// Only create the payment (no redirect / popup):
const { checkout_url, payment_id, order_id } = await StepPay.createPayment({
  merchant_id: ${v.merchantId}, amount: 2550, currency: "GEL", order_desc: "Pizza",
});`,
          },
          {
            label: "No-JS button",
            lang: "html",
            code: `<!-- The SDK turns any element with data-steppay-pay into a Pay button -->
<button data-steppay-pay
        data-merchant-id="${v.merchantId}"
        data-amount="2550"
        data-currency="GEL"
        data-description="Pizza Margherita"
        data-mode="modal">
  Pay 25.50 GEL
</button>`,
          },
        ]}
      />

      <Callout tone="warning" title="Security note" className="mt-8">
        In the browser anyone can change the amount or fake the result URL. For school projects that is fine; real shops create payments on the server
        and confirm them with a <Link href="/docs/callbacks">callback</Link>. See <Link href="/docs/quick-start#level-2">Level 2</Link>.
      </Callout>
    </div>
  );
}
