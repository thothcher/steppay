import Link from "next/link";
import { Callout } from "@/components/ui";
import { Code, CodeTabs } from "@/components/ui/client";
import { nodeServer, phpCallback, pythonFlask } from "@/lib/snippets";
import { DocHeader } from "../parts";
import { docVars } from "../vars";

export const metadata = { title: "Redirects & callbacks" };

export default async function CallbacksDocs() {
  const v = await docVars();
  const nodeCallback = nodeServer(v).split("// 2) StepPay calls this URL")[1];
  const pyCallback = pythonFlask(v).split('@app.post("/steppay-callback")')[1];
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Integrate"
        title="Redirects & callbacks"
        lead="After the customer pays, StepPay tells your website the result in two ways: the browser is redirected to your response_url, and your server receives a POST to server_callback_url."
      />

      <table>
        <thead>
          <tr>
            <th />
            <th>response_url (redirect)</th>
            <th>server_callback_url (callback)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Who receives it</th>
            <td>The customer’s browser</td>
            <td>Your server</td>
          </tr>
          <tr>
            <th>How</th>
            <td>
              <code>GET</code> with the result as URL parameters
            </td>
            <td>
              <code>POST</code> with a JSON body
            </td>
          </tr>
          <tr>
            <th>Use it to</th>
            <td>Show “Thank you” or “Payment failed”</td>
            <td>Mark the order as paid in your database</td>
          </tr>
          <tr>
            <th>Can you trust it?</th>
            <td>Only after checking the signature on a server</td>
            <td>Yes, after checking the signature</td>
          </tr>
          <tr>
            <th>Works on localhost</th>
            <td>✅ yes</td>
            <td>❌ no — needs a public URL</td>
          </tr>
        </tbody>
      </table>

      <h2 id="redirect">The redirect (response_url)</h2>
      <p>
        The checkout shows the result for 5 seconds and then opens your <code>response_url</code> with parameters added, for example:
      </p>
      <Code
        lang="text"
        code={`https://my-shop.netlify.app/thank-you.html
  ?order_id=order_1042
  &merchant_id=${v.merchantId}
  &payment_id=1013000021
  &order_status=approved
  &amount=3700
  &currency=GEL
  &masked_card=424242XXXXXX4242
  &response_code=00
  &signature=0d8bd1bcb7a0f2bb38c5c46b6d3a2f6c0f9a8e11
  …`}
      />
      <p>
        Read them with <code>StepPay.parseResult()</code> (see <Link href="/docs/sdk#parse">SDK</Link>) or{" "}
        <code>new URLSearchParams(location.search)</code>.
      </p>
      <Callout tone="info" title="Difference from real providers">
        To keep static student sites working, StepPay redirects with <b>GET</b>. Many real providers send the customer back with a <b>POST</b> form
        instead — then a real shop needs a server route for <code>response_url</code>. Always check your provider’s documentation.
      </Callout>

      <h2 id="callback">The server callback (server_callback_url)</h2>
      <p>
        StepPay sends a <code>POST</code> request with <code>Content-Type: application/json</code> when a payment is approved, declined, refunded or
        captured. Answer with HTTP <b>200</b>. If your server is down or answers an error, you will see it in{" "}
        <Link href="/portal/logs?tab=callbacks">Developer logs → Server callbacks</Link> and can press <b>Resend callback</b> on the payment page.
      </p>
      <Code
        lang="json"
        title="POST body"
        code={`{
  "order_id": "order_1042",
  "merchant_id": ${v.merchantId},
  "payment_id": 1013000021,
  "order_status": "approved",
  "response_status": "success",
  "tran_type": "purchase",
  "amount": 3700,
  "currency": "GEL",
  "actual_amount": 3700,
  "actual_currency": "GEL",
  "reversal_amount": 0,
  "sender_email": "buyer@example.com",
  "masked_card": "424242XXXXXX4242",
  "card_bin": "424242",
  "card_type": "VISA",
  "rrn": "604417238109",
  "approval_code": "K3XQ7A",
  "response_code": "00",
  "response_description": "Approved",
  "order_time": "11.10.2026 22:14:33",
  "signature": "0d8bd1bcb7a0f2bb38c5c46b6d3a2f6c0f9a8e11"
}`}
      />
      <p>
        For refunds <code>tran_type</code> is <code>reverse</code> and <code>reversal_amount</code> shows the refunded total.
      </p>

      <h3>Handle it</h3>
      <CodeTabs
        tabs={[
          { label: "Node.js + Express", lang: "js", code: `// 2) StepPay calls this URL${nodeCallback.replace(/\napp\.listen[\s\S]*$/, "")}`.trim() },
          { label: "PHP", lang: "php", code: phpCallback() },
          { label: "Python + Flask", lang: "python", code: `@app.post("/steppay-callback")${pyCallback}`.trim() },
        ]}
      />

      <h2 id="localhost">Testing callbacks from your computer</h2>
      <ol>
        <li>
          <b>Tunnel:</b> run <code>npx ngrok http 3000</code> (or <code>cloudflared tunnel --url http://localhost:3000</code>) and use the https
          address it prints as <code>server_callback_url</code>.
        </li>
        <li>
          <b>Inspect only:</b> create a free URL on{" "}
          <a href="https://webhook.site" target="_blank" rel="noreferrer">
            webhook.site
          </a>{" "}
          and use it to see what StepPay sends.
        </li>
        <li>
          <b>Deploy:</b> put your backend on Render, Railway or Vercel.
        </li>
        <li>
          <b>No callbacks at all:</b> on your thank-you page ask your server to call <Link href="/docs/api#status">/api/status/order_id</Link>.
        </li>
      </ol>

      <Callout tone="warning" title="Make your handler idempotent">
        The same callback can arrive twice (e.g. after “Resend callback”). Update the order only if it is not already paid.
      </Callout>
    </div>
  );
}
