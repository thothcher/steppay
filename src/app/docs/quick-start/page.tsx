import Link from "next/link";
import { Callout } from "@/components/ui";
import { Code, CodeTabs } from "@/components/ui/client";
import * as S from "@/lib/snippets";
import { DocHeader, Step, Steps } from "../parts";
import { docVars } from "../vars";

export const metadata = { title: "Step-by-step guide" };

export default async function QuickStart() {
  const v = await docVars();
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Getting started"
        title="Add payments to your shop, step by step"
        lead="In this guide you connect StepPay to an online shop — for example your online restaurant. First the simplest version with no backend (Level 1), then the secure version real shops use (Level 2)."
      />

      {v.personal ? (
        <Callout tone="success" title="You are signed in">
          The code on this page already contains <b>your</b> merchant ID{v.secret ? " and secret key" : ""}. Copy and paste.
        </Callout>
      ) : (
        <Callout tone="info" title="Tip">
          <Link href="/login">Sign in</Link> and this page will show code with your own keys inside.
        </Callout>
      )}

      <h2 id="keys">Part 1 — Get your keys</h2>
      <Steps>
        <Step title="Create an account">
          <p>
            Open <Link href="/register">Create account</Link>, enter your name, e-mail and group. If the form asks for an <em>academy code</em>, your
            lecturer will give it to you.
          </p>
        </Step>
        <Step title="Create your merchant (Activation → Step 1)">
          <p>
            After sign-up you land on <b>Activation</b>. Fill in the company information (invented data is fine — this is a sandbox) and the name +
            URL of your website. Press <b>Create merchant &amp; continue</b>.
          </p>
          <p>
            Your merchant gets a <code>merchant_id</code> and a <code>secret key</code> immediately — test payments work right away. Steps 2–4
            (director, IBAN, approval) are only needed for <Link href="/portal/settlements">settlements</Link>; finish them whenever you like.
          </p>
        </Step>
        <Step title="Copy your keys">
          <p>
            Go to <b>Payment solutions → Integration</b> (or <b>Merchant settings</b>). You will see:
          </p>
          <Code
            lang="bash"
            title="your keys"
            code={`Merchant ID : ${v.merchantId}        ← public, OK in the browser\nSecret key  : ${v.personal ? v.secret : "sk_test_••••••••"}   ← private, server only\nAPI         : ${v.base}/api`}
          />
        </Step>
      </Steps>

      <h2 id="level-1">Part 2 — Level 1: a shop without a backend</h2>
      <p>
        Perfect for a static website (HTML/CSS/JS, React, Vue) hosted on Netlify, Vercel or GitHub Pages. The browser talks to StepPay directly with
        the <Link href="/docs/sdk">JavaScript SDK</Link>.
      </p>
      <Steps>
        <Step title="Add the SDK to your page">
          <p>
            Put this line inside <code>&lt;head&gt;</code> of every page that has a “Pay” button and of your thank-you page:
          </p>
          <Code lang="html" code={`<script src="${v.base}/sdk/steppay.js"></script>`} />
        </Step>
        <Step title="Start a payment when the customer clicks “Pay”">
          <p>
            Call <code>StepPay.checkout()</code> with your merchant ID, the amount <b>in tetri</b> and a description. Pick a version:
          </p>
          <CodeTabs
            storageKey="qs-frontend"
            tabs={[
              { label: "Simple page", lang: "html", code: S.htmlShop(v), title: "index.html" },
              { label: "Cart + popup", lang: "html", code: S.htmlCart(v), title: "cart.html" },
              { label: "React", lang: "jsx", code: S.reactSnippet(v), title: "PayButton.jsx" },
            ]}
          />
          <Callout tone="warning" title="The amount is in minor units">
            25.50 GEL must be sent as <code>2550</code>. Sending <code>25.5</code> returns error 1004. Use <code>StepPay.toMinor(25.5)</code> to
            convert.
          </Callout>
        </Step>
        <Step title="Create the thank-you page">
          <p>
            After paying, the customer is sent to your <code>response_url</code> with the result in the address bar (
            <code>?order_status=approved&amp;order_id=…</code>). Read it with <code>StepPay.parseResult()</code>:
          </p>
          <Code lang="html" title="thank-you.html" code={S.thankYouPage(v)} />
        </Step>
        <Step title="Test it">
          <ol>
            <li>
              Open your shop and click <b>Pay</b>.
            </li>
            <li>
              On the checkout click the card <code>4242 4242 4242 4242</code> in the <i>Test cards</i> list (any future date, any CVV) and pay.
            </li>
            <li>You land on your thank-you page. 🎉</li>
            <li>
              Open the portal → <Link href="/portal/payments">Payments</Link>: your order is there with status <b>Approved</b>.
            </li>
            <li>
              Try a declined card (<code>4000 0000 0000 0002</code>) and the 3-D Secure card — does your thank-you page handle them?
            </li>
          </ol>
        </Step>
      </Steps>

      <Callout tone="warning" title="Why Level 1 is not enough for a real shop">
        Everything runs in the customer’s browser, so a clever customer can open DevTools and change the price to 0.01, or type
        <code>?order_status=approved</code> into the address bar. Real shops decide the price and confirm payments on their <b>server</b>. That is
        Level 2.
      </Callout>

      <h2 id="level-2">Part 3 — Level 2: with a backend (how real shops do it)</h2>
      <Steps>
        <Step title="Keep the secret key in an .env file">
          <Code lang="bash" title=".env" code={S.envFile(v)} />
          <p>
            Add <code>.env</code> to <code>.gitignore</code>. If a secret ever leaks, press <b>Regenerate secret</b> in Merchant settings.
          </p>
        </Step>
        <Step title="Create the payment on your server">
          <p>
            Your server calculates the price from <b>its own</b> product list, builds the request, adds the{" "}
            <Link href="/docs/signature">signature</Link> and calls <code>POST /api/checkout/url</code>. It answers the browser with the{" "}
            <code>checkout_url</code>.
          </p>
          <CodeTabs
            storageKey="qs-backend"
            tabs={[
              { label: "Node.js + Express", lang: "js", code: S.nodeServer(v), title: "server.js" },
              {
                label: "PHP",
                lang: "php",
                code: `${S.phpConfig(v)}\n\n${S.phpCheckout().replace("<?php\n", "")}`,
                title: "config.php + checkout.php",
              },
              { label: "Python + Flask", lang: "python", code: S.pythonFlask(v), title: "app.py" },
            ]}
          />
        </Step>
        <Step title="Send the customer to the checkout">
          <p>The browser only sends the cart (product IDs and quantities — no prices!) and follows the link:</p>
          <Code lang="html" title="public/index.html" code={S.nodeFrontend()} />
        </Step>
        <Step title="Receive the callback">
          <p>
            When the payment finishes, StepPay sends a <b>POST</b> with JSON to your <code>server_callback_url</code>. Check the signature, update the
            order in your database and answer <code>200 OK</code>. See <Link href="/docs/callbacks">Redirects &amp; callbacks</Link>.
          </p>
          <Callout tone="info" title="Working on localhost?">
            StepPay cannot reach <code>localhost</code>. Deploy your backend (Render, Railway, Vercel) or use a tunnel (<code>ngrok http 3000</code>).
            Until then, check the result from your thank-you page with the <Link href="/docs/api#status">status API</Link>.
          </Callout>
        </Step>
      </Steps>

      <h2 id="checklist">Part 4 — Checklist before you present your project</h2>
      <ul>
        <li>
          ✅ Every payment has a new, unique <code>order_id</code>.
        </li>
        <li>✅ Amounts are whole numbers in tetri/cents.</li>
        <li>
          ✅ The thank-you page handles approved <b>and</b> declined results.
        </li>
        <li>✅ The secret key is not in frontend code or on GitHub.</li>
        <li>✅ (Level 2) Prices are calculated on the server and the callback signature is verified.</li>
        <li>✅ Your orders appear in the portal → Payments, and the Developer logs show no errors.</li>
      </ul>

      <h2 id="errors">Common errors</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>What it means</th>
            <th>How to fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1001</td>
            <td>A required parameter is missing</td>
            <td>Send merchant_id, order_id, order_desc, amount and currency.</td>
          </tr>
          <tr>
            <td>1002</td>
            <td>Merchant not found</td>
            <td>Copy the merchant_id again from Merchant settings.</td>
          </tr>
          <tr>
            <td>1004</td>
            <td>Wrong parameter value</td>
            <td>
              Usually <code>amount: 25.5</code> → send <code>2550</code>.
            </td>
          </tr>
          <tr>
            <td>1013</td>
            <td>Duplicate order_id</td>
            <td>
              Generate a new order_id for every payment, e.g. <code>"order_" + Date.now()</code>.
            </td>
          </tr>
          <tr>
            <td>1014</td>
            <td>Invalid signature</td>
            <td>
              Compare your string with <code>request_signature_string</code> in the response or in <Link href="/portal/logs">Developer logs</Link>.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Full list: <Link href="/docs/api#errors">API reference → Errors</Link>.
      </p>
    </div>
  );
}
