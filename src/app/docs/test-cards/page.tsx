import { Callout } from "@/components/ui";
import { CopyButton } from "@/components/ui/client";
import { TEST_CARDS, THREE_DS_CODE, formatCardNumber } from "@/lib/testcards";
import { DocHeader } from "../parts";

export const metadata = { title: "Test cards" };

export default function TestCardsDocs() {
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Getting started"
        title="Test cards"
        lead="StepPay only accepts these card numbers. Use any expiry date in the future (e.g. 12/30) and any 3-digit CVV (e.g. 123). Real cards are always rejected."
      />
      <div className="my-6 overflow-hidden rounded-2xl border border-line bg-white">
        {TEST_CARDS.map((c, i) => (
          <div key={c.number} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 ${i ? "border-t border-line" : ""}`}>
            <span className={`size-2.5 rounded-full ${c.result === "approved" ? "bg-brand-500" : "bg-red-500"}`} />
            <code className="!bg-transparent !p-0 font-mono text-[15px] !text-ink">{formatCardNumber(c.number)}</code>
            <CopyButton value={c.number} />
            <span className="text-[12px] font-bold text-ink-3">{c.brand}</span>
            <span className="ml-auto text-[14px] text-ink-2">{c.label}</span>
          </div>
        ))}
      </div>

      <h2>What each card teaches</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Card</th>
            <th>What you should see</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Happy path</td>
            <td>4242 4242 4242 4242</td>
            <td>
              Status <code>approved</code>, response code <code>00</code>. Your thank-you page says “Thank you”.
            </td>
          </tr>
          <tr>
            <td>3-D Secure</td>
            <td>4000 0027 6000 3184</td>
            <td>
              A bank page asks for a one-time code. Enter <code>{THREE_DS_CODE}</code>. Three wrong codes or “Cancel” → <code>declined</code> with
              code 82.
            </td>
          </tr>
          <tr>
            <td>Declined</td>
            <td>4000 0000 0000 0002 / 9995 / 0069</td>
            <td>
              Status <code>declined</code> with codes <code>05</code> (do not honor), <code>51</code> (insufficient funds), <code>54</code> (expired
              card). Show a friendly error and let the customer try again with a <b>new</b> order_id.
            </td>
          </tr>
          <tr>
            <td>Dispute</td>
            <td>4000 0000 0000 0259</td>
            <td>
              Approved, then a chargeback appears under Transactions → Disputes. Respond with evidence within 7 days (the “bank” decides after 2
              minutes).
            </td>
          </tr>
          <tr>
            <td>Expired order</td>
            <td>—</td>
            <td>
              Create a payment and don’t pay. After <code>lifetime</code> seconds (default 3600) it becomes <code>expired</code>. Use{" "}
              <code>lifetime: 60</code> to test quickly.
            </td>
          </tr>
        </tbody>
      </table>
      <Callout tone="warning" title="Never type a real card">
        This is a learning sandbox. The checkout refuses real card numbers and only stores masked numbers like <code>424242XXXXXX4242</code>.
      </Callout>
    </div>
  );
}
