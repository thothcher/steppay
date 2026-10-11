import Link from "next/link";
import { Callout } from "@/components/ui";
import { Code, CodeTabs } from "@/components/ui/client";
import { curlSnippet } from "@/lib/snippets";
import { DocHeader, Endpoint, ParamTable } from "../parts";
import { docVars } from "../vars";

export const metadata = { title: "API reference" };

const ERRORS: [number, string, string][] = [
  [1000, "Invalid request body", 'The body is not JSON. Send {"request": {...}} with Content-Type: application/json.'],
  [1001, "Required parameter is missing", "The message names the missing parameter."],
  [1002, "Merchant not found", "Wrong merchant_id."],
  [1003, "Merchant is disabled", "Enable the merchant in Merchant settings."],
  [1004, "Invalid parameter value", "Most often amount is not a whole number (25.5 instead of 2550) or a URL is not http(s)."],
  [1005, "Unsupported currency", "Use GEL, USD or EUR. For refunds the currency must match the order."],
  [1012, "Order not found", "No order with this order_id for this merchant."],
  [1013, "Duplicate order_id", "This order_id was already paid/used. Generate a new one."],
  [1014, "Invalid signature", "Compare your signature string with request_signature_string."],
  [1015, "Refund amount too large", "You can refund at most amount − already refunded."],
  [1016, "Operation not allowed", "E.g. refunding a declined payment or capturing a non-preauth payment."],
  [1099, "Internal error", "Something broke on our side. Try again; tell your lecturer if it repeats."],
];

export default async function ApiDocs() {
  const v = await docVars();
  const api = `${v.base}/api`;
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Integrate"
        title="API reference"
        lead="Four HTTP endpoints. The request and response format follows the Flitt (Fondy) protocol v1.0, so the knowledge transfers to real providers."
      />

      <h2 id="basics">Basics</h2>
      <ul>
        <li>
          Base URL: <code>{api}</code>
        </li>
        <li>
          Method <code>POST</code>, header <code>Content-Type: application/json</code>.
        </li>
        <li>
          Parameters are wrapped in <code>request</code>, answers in <code>response</code>.
        </li>
        <li>
          The HTTP status is always <b>200</b>. Check <code>response.response_status</code>: <code>&quot;success&quot;</code> or{" "}
          <code>&quot;failure&quot;</code>.
        </li>
        <li>
          Every request must contain a <Link href="/docs/signature">signature</Link> (except unsigned frontend payments).
        </li>
        <li>
          Every call is visible in the portal → <Link href="/portal/logs">Developer logs</Link>.
        </li>
      </ul>

      <h2 id="create">Create a payment</h2>
      <Endpoint method="POST" path={`${api}/checkout/url`} />
      <p>
        Creates an order and returns the link to the hosted checkout. Send the customer to <code>checkout_url</code>.
      </p>
      <ParamTable
        params={[
          { name: "merchant_id", type: "integer", required: true, description: "Your Merchant ID.", example: v.merchantId },
          {
            name: "order_id",
            type: "string(100)",
            required: true,
            description: "Your unique ID of this order. Re-sending an unpaid order with the same amount returns the same checkout_url.",
            example: "order_1042",
          },
          {
            name: "order_desc",
            type: "string(1024)",
            required: true,
            description: "Description shown to the customer.",
            example: "Pizza Margherita × 2",
          },
          { name: "amount", type: "integer", required: true, description: "Amount in minor units (tetri/cents).", example: "2550" },
          { name: "currency", type: "string", required: true, description: "GEL, USD or EUR." },
          {
            name: "signature",
            type: "string",
            required: true,
            description: (
              <>
                SHA-1 signature, see <Link href="/docs/signature">Signature</Link>.
              </>
            ),
          },
          { name: "response_url", type: "string", description: "Where the customer returns after paying. Receives the result as GET parameters." },
          {
            name: "server_callback_url",
            type: "string",
            description: "Your server endpoint for the POST callback. Must be reachable from the internet.",
          },
          { name: "sender_email", type: "string", description: "Customer e-mail, pre-filled on the checkout." },
          {
            name: "lifetime",
            type: "integer",
            description: "Seconds the checkout link stays valid (60–604800). Default 3600. Afterwards the order becomes expired.",
          },
          { name: "merchant_data", type: "string(2048)", description: "Any text you want back in the result (e.g. JSON with cart ID)." },
          { name: "preauth", type: '"Y" | "N"', description: "Y = only hold (block) the money; capture it later with /capture/order_id." },
          { name: "lang", type: "string", description: "Checkout language hint, e.g. en, ka." },
        ]}
      />
      <CodeTabs
        tabs={[
          {
            label: "Request",
            lang: "json",
            code: `{
  "request": {
    "merchant_id": ${v.merchantId},
    "order_id": "order_1042",
    "order_desc": "Pizza Margherita × 2",
    "amount": 3700,
    "currency": "GEL",
    "response_url": "https://my-shop.netlify.app/thank-you.html",
    "server_callback_url": "https://api.my-shop.com/steppay-callback",
    "signature": "f4e8f2bd4a4c0e8f2d1c6b2d0d7a6e1e9f0b3c5a"
  }
}`,
          },
          {
            label: "Success",
            lang: "json",
            code: `{
  "response": {
    "response_status": "success",
    "checkout_url": "${v.base}/checkout/r6e8pJ3eRvAt4gBNHjX7W3xMBFmLWZsA",
    "payment_id": 1013000021,
    "order_id": "order_1042"
  }
}`,
          },
          {
            label: "Failure",
            lang: "json",
            code: `{
  "response": {
    "response_status": "failure",
    "error_code": 1014,
    "error_message": "Invalid signature. Compare your signature string with request_signature_string.",
    "request_signature_string": "**********|3700|GEL|${v.merchantId}|Pizza Margherita × 2|order_1042|https://my-shop.netlify.app/thank-you.html|https://api.my-shop.com/steppay-callback"
  }
}`,
          },
          { label: "cURL", lang: "bash", code: curlSnippet(v) },
        ]}
      />

      <h2 id="status">Get order status</h2>
      <Endpoint method="POST" path={`${api}/status/order_id`} />
      <p>Ask for the current state of an order at any time — the safe way to confirm a payment when you cannot receive callbacks.</p>
      <ParamTable
        params={[
          { name: "merchant_id", type: "integer", required: true, description: "Your Merchant ID." },
          { name: "order_id", type: "string", required: true, description: "The order to look up." },
          { name: "signature", type: "string", required: true, description: "Signature of the two parameters above." },
        ]}
      />
      <Code
        lang="json"
        title="response"
        code={`{
  "response": {
    "response_status": "success",
    "order_id": "order_1042",
    "merchant_id": ${v.merchantId},
    "payment_id": 1013000021,
    "order_status": "approved",
    "tran_type": "purchase",
    "amount": 3700,
    "currency": "GEL",
    "actual_amount": 3700,
    "actual_currency": "GEL",
    "reversal_amount": 0,
    "masked_card": "424242XXXXXX4242",
    "card_bin": "424242",
    "card_type": "VISA",
    "rrn": "604417238109",
    "approval_code": "K3XQ7A",
    "response_code": "00",
    "response_description": "Approved",
    "sender_email": "buyer@example.com",
    "order_time": "11.10.2026 22:14:33",
    "signature": "0d8bd1bcb7a0f2bb38c5c46b6d3a2f6c0f9a8e11"
  }
}`}
      />
      <p>
        Possible <code>order_status</code> values: <code>created</code>, <code>processing</code>, <code>approved</code>, <code>declined</code>,{" "}
        <code>expired</code>, <code>reversed</code>.
      </p>

      <h2 id="refund">Refund (reverse)</h2>
      <Endpoint method="POST" path={`${api}/reverse/order_id`} />
      <p>
        Returns money for an approved order — fully or partially. A full refund changes the status to <code>reversed</code>.
      </p>
      <ParamTable
        params={[
          { name: "merchant_id", type: "integer", required: true, description: "Your Merchant ID." },
          { name: "order_id", type: "string", required: true, description: "The paid order." },
          { name: "amount", type: "integer", required: true, description: "Amount to refund in minor units." },
          { name: "currency", type: "string", required: true, description: "Must equal the order currency." },
          { name: "comment", type: "string", description: "Reason (visible in the portal)." },
          { name: "signature", type: "string", required: true, description: "Signature." },
        ]}
      />
      <Code
        lang="json"
        title="response"
        code={`{
  "response": {
    "response_status": "success",
    "order_id": "order_1042",
    "merchant_id": ${v.merchantId},
    "reverse_status": "approved",
    "reversal_amount": 1000,
    "total_reversal_amount": 1000,
    "order_status": "approved",
    "currency": "GEL",
    "signature": "…"
  }
}`}
      />

      <h2 id="capture">Capture a pre-authorization</h2>
      <Endpoint method="POST" path={`${api}/capture/order_id`} />
      <p>
        Hotels and rentals first <i>block</i> money and charge it later. Create the payment with <code>preauth: &quot;Y&quot;</code> — after the
        customer pays it appears under <b>Payments → Uncaptured</b>. Capture it with this call or the button in the portal. Only captured payments are
        settled.
      </p>
      <ParamTable
        params={[
          { name: "merchant_id", type: "integer", required: true, description: "Your Merchant ID." },
          { name: "order_id", type: "string", required: true, description: "The pre-authorized order." },
          { name: "amount", type: "integer", description: "Full order amount (partial capture is not supported in the sandbox)." },
          { name: "currency", type: "string", description: "Order currency." },
          { name: "signature", type: "string", required: true, description: "Signature." },
        ]}
      />

      <h2 id="errors">Errors</h2>
      <table>
        <thead>
          <tr>
            <th>error_code</th>
            <th>Meaning</th>
            <th>What to do</th>
          </tr>
        </thead>
        <tbody>
          {ERRORS.map(([code, title, text]) => (
            <tr key={code}>
              <td>
                <code>{code}</code>
              </td>
              <td>{title}</td>
              <td>{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Callout tone="info" title="Try it without code">
        The <Link href="/portal/playground">API playground</Link> builds requests, shows the signature step by step and sends them for you.
      </Callout>
    </div>
  );
}
