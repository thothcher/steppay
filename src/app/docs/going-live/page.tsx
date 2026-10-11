import { Callout } from "@/components/ui";
import { DocHeader } from "../parts";

export const metadata = { title: "Going live" };

export default function GoingLiveDocs() {
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Next steps"
        title="Going live with a real provider"
        lead="StepPay copies the structure of a real bank payment gateway (Flitt). When you build a shop for a real client, most of your code stays the same — here is what changes and what to check."
      />

      <h2>What stays the same</h2>
      <table>
        <thead>
          <tr>
            <th>Concept</th>
            <th>StepPay</th>
            <th>Real provider (Flitt-style)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create payment</td>
            <td>
              <code>POST /api/checkout/url</code>
            </td>
            <td>Same idea: get a checkout URL for an order</td>
          </tr>
          <tr>
            <td>Request format</td>
            <td>
              <code>{`{"request": {...}}`}</code>
            </td>
            <td>Same wrapper and parameter names (merchant_id, order_id, amount, currency, order_desc…)</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>Minor units (2550)</td>
            <td>Minor units</td>
          </tr>
          <tr>
            <td>Signature</td>
            <td>SHA-1 of SECRET|sorted values</td>
            <td>Same principle; check the exact algorithm in the provider docs</td>
          </tr>
          <tr>
            <td>Order status / refund / capture</td>
            <td>status, reverse, capture endpoints</td>
            <td>Equivalent endpoints exist</td>
          </tr>
          <tr>
            <td>Result</td>
            <td>response_url + server_callback_url</td>
            <td>response_url + server_callback_url</td>
          </tr>
        </tbody>
      </table>

      <h2>What changes</h2>
      <ul>
        <li>
          <b>Base URL and keys.</b> The provider gives you a test merchant first, then live keys after activation. Keep them in environment variables
          so switching is one line.
        </li>
        <li>
          <b>Real activation (KYC).</b> Real documents, a real company and a real bank account. Banks also check the website — see the checklist
          below.
        </li>
        <li>
          <b>Redirect method.</b> Some providers return the customer to <code>response_url</code> with a POST form instead of GET.
        </li>
        <li>
          <b>Test cards and error codes</b> are provider specific.
        </li>
        <li>
          <b>Fees and settlement times</b> are in your contract.
        </li>
      </ul>
      <Callout tone="info">Always read the provider’s current documentation — this page explains the ideas, not their exact API.</Callout>

      <h2>Production checklist</h2>
      <ol>
        <li>
          The site uses <b>HTTPS</b>.
        </li>
        <li>The secret key lives only in server environment variables — never in Git, never in the browser.</li>
        <li>
          Prices and totals are calculated on the <b>server</b> from your database.
        </li>
        <li>The order is saved in your database (status “created”) before the customer goes to the checkout.</li>
        <li>
          The order becomes “paid” only after a <b>signed callback</b> (or a status API check) — never because of the redirect URL alone.
        </li>
        <li>The callback handler is idempotent and always answers 200.</li>
        <li>Declined, expired and refunded payments are handled in the UI and in the database.</li>
        <li>You never see or store card numbers — the hosted checkout handles them (this keeps you out of PCI DSS scope).</li>
        <li>
          The website has the pages banks require: <b>terms of service, privacy policy, delivery &amp; refund policy, contacts</b>, and visible
          prices.
        </li>
        <li>You log every payment request and callback so you can investigate problems.</li>
      </ol>
    </div>
  );
}
