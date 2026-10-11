import Link from "next/link";
import { Callout } from "@/components/ui";
import { DocHeader } from "../parts";

export const metadata = { title: "For lecturers" };

const LEVELS = [
  {
    level: "Level 0",
    title: "Payment link",
    time: "15 min",
    task: "Create a payment link and put a “Pay” button on a landing page.",
    check: "A payment with integration type “Payment link” is approved.",
  },
  {
    level: "Level 1",
    title: "Frontend shop",
    time: "1–2 lessons",
    task: "Static shop with a cart. Pay with the SDK (redirect or popup). Thank-you page that handles approved and declined.",
    check: "Approved and declined payments from type “JavaScript SDK”; order_desc lists the cart.",
  },
  {
    level: "Level 2",
    title: "Backend integration",
    time: "2–3 lessons",
    task: "Node/PHP/Python backend: prices on the server, signed request, callback with signature check, orders table.",
    check: "Type “Server API (signed)”, callbacks with HTTP 200 in Developer logs.",
  },
  {
    level: "Level 3",
    title: "Merchant admin",
    time: "project",
    task: "Admin page in the student’s shop: refunds via /reverse/order_id, booking with preauth + capture, status sync.",
    check: "Refunds with source “api”, captured pre-authorizations.",
  },
];

export default function LecturersDocs() {
  return (
    <div className="prose-doc">
      <DocHeader
        eyebrow="Next steps"
        title="For lecturers"
        lead="StepPay is built for a whole academy: every student has an account, the lecturer sees everything in one panel."
      />

      <h2>Lecturer panel</h2>
      <p>
        Users whose e-mail is listed in the <code>ADMIN_EMAILS</code> environment variable get the <b>Lecturer</b> role and a{" "}
        <Link href="/portal/admin">Lecturer panel</Link> in the sidebar:
      </p>
      <ul>
        <li>All students with group, activation status, number of merchants and payments, approved volume and last activity.</li>
        <li>Filter by group (students enter it when they register) and search by name or e-mail.</li>
        <li>
          Open a student to see their merchants and payments, open any payment, <b>reset a forgotten password</b> or make them a lecturer.
        </li>
        <li>The latest payments across the whole academy — great to project live during a lesson.</li>
      </ul>

      <h2>Classroom setup</h2>
      <ol>
        <li>
          Set <code>REGISTRATION_CODE</code> (e.g. <code>STEP-2026</code>) so only your students can register, and tell them the code.
        </li>
        <li>Ask students to write their group name exactly the same way (e.g. WD-2026-A).</li>
        <li>
          Share the portal address and the <Link href="/docs/quick-start">step-by-step guide</Link>.
        </li>
      </ol>

      <h2>Suggested assignments</h2>
      <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LEVELS.map((l) => (
          <div key={l.level} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-lime-200 px-2 py-0.5 text-[12px] font-bold text-forest-900">{l.level}</span>
              <span className="text-[12.5px] text-ink-3">{l.time}</span>
            </div>
            <div className="mt-2 text-[16px] font-bold text-ink">{l.title}</div>
            <p className="!my-1 text-[14px]">{l.task}</p>
            <p className="!my-0 text-[13px] text-ink-3">
              <b className="text-ink-2">How to check:</b> {l.check}
            </p>
          </div>
        ))}
      </div>

      <Callout tone="info" title="Teaching moments built in">
        Invalid signatures return the expected string (with the secret hidden); the Developer logs show every request and callback; the dispute card
        creates a chargeback to discuss customer service; settlements show fees and T+1 payouts.
      </Callout>
    </div>
  );
}
