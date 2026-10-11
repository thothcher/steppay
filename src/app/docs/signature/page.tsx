import Link from "next/link";
import { Callout } from "@/components/ui";
import { Code, CodeTabs } from "@/components/ui/client";
import { sign, signatureString } from "@/lib/signature";
import { phpConfig, pythonFlask, signJs } from "@/lib/snippets";
import { DocHeader, Step, Steps } from "../parts";
import { docVars } from "../vars";

export const metadata = { title: "Signature" };

export default async function SignatureDocs() {
  const v = await docVars();
  const secret = "test";
  const params = {
    merchant_id: 1234567,
    order_id: "order_1042",
    order_desc: "Pizza",
    amount: 2550,
    currency: "GEL",
    sender_email: "",
  };
  const sorted = Object.keys(params).sort();
  const str = signatureString(secret, params);
  const sig = sign(secret, params);

  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Integrate"
        title="Signature"
        lead="The signature proves that a request really comes from you and that nobody changed the amount on the way. It is a SHA-1 hash of your secret key and the request values."
      />

      <h2>The algorithm</h2>
      <Steps>
        <Step title="Take all request parameters except signature">
          <p>Drop parameters with empty values (&quot;&quot;, null). Objects and arrays are skipped too.</p>
        </Step>
        <Step title="Sort the parameters alphabetically by NAME">
          <p>
            Not by value! <code>amount</code> comes before <code>currency</code>, <code>merchant_id</code> before <code>order_desc</code>.
          </p>
        </Step>
        <Step title="Join: secret key, then the values, with “|”">
          <p>
            <code>SECRET|value1|value2|value3…</code>
          </p>
        </Step>
        <Step title="Calculate SHA-1 of that string (lowercase hex)">
          <p>
            That 40-character string is your signature. Add it as the <code>signature</code> parameter.
          </p>
        </Step>
      </Steps>

      <h2>Worked example</h2>
      <p>
        Secret key <code>{secret}</code> and these parameters:
      </p>
      <Code lang="json" code={JSON.stringify(params, null, 2)} />
      <p>
        1. Remove empty values → <code>sender_email</code> is gone. 2. Sort names:
      </p>
      <Code lang="text" code={sorted.filter((k) => params[k as keyof typeof params] !== "").join("  →  ")} />
      <p>3. Join the secret and the values in that order:</p>
      <Code lang="text" code={str} />
      <p>4. SHA-1:</p>
      <Code lang="text" code={sig} />
      <p>
        Check it yourself: <code>sha1(&quot;{str}&quot;)</code> in any online SHA-1 tool gives the same result.
      </p>

      <h2>Code</h2>
      <CodeTabs
        tabs={[
          { label: "JavaScript (Node.js)", lang: "js", code: signJs() },
          { label: "PHP", lang: "php", code: phpConfig({ ...v, secret: "YOUR_SECRET_KEY" }) },
          {
            label: "Python",
            lang: "python",
            code: pythonFlask({ ...v, secret: "YOUR_SECRET_KEY" })
              .split("@app.post")[0]
              .trim(),
          },
        ]}
      />

      <h2>Checking signatures you receive</h2>
      <p>
        Redirects, callbacks and API answers from StepPay are signed the same way. Recalculate the signature from the data you received (without the{" "}
        <code>signature</code> field) and compare. If they differ, ignore the request — someone is faking it.
      </p>
      <Code
        lang="js"
        code={`app.post("/api/steppay-callback", (req, res) => {
  const data = req.body;
  if (data.signature !== sign(data, process.env.STEPPAY_SECRET_KEY)) {
    return res.status(400).send("Invalid signature"); // fake request!
  }
  // ...safe to trust data.order_status here
  res.sendStatus(200);
});`}
      />

      <h2>Common mistakes</h2>
      <ul>
        <li>Sorting by values instead of parameter names.</li>
        <li>Forgetting the secret key at the start, or adding a “|” at the end.</li>
        <li>
          Sending <code>amount: 25.5</code> (the server sees “25.5”, you signed something else) — always integers.
        </li>
        <li>Signing different values than you send (e.g. you change order_desc after signing).</li>
        <li>Including empty parameters in the string — they must be skipped.</li>
        <li>Using an old secret key after pressing “Regenerate”.</li>
      </ul>
      <Callout tone="info" title="Debugging tip">
        When the signature is wrong, the error response contains <code>request_signature_string</code> — the exact string we expected, with your
        secret replaced by stars. Compare it character by character with yours. The <Link href="/portal/playground">API playground</Link> shows the
        string live.
      </Callout>
    </div>
  );
}
