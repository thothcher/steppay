import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { companiesOf } from "@/lib/merchants";
import { Card, PageHeader } from "@/components/ui";
import { NewMerchantForm } from "../forms";

export const metadata = { title: "New merchant" };

export default async function NewMerchantPage() {
  const user = await requireUser();
  const companies = await companiesOf(user.id);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/portal/merchants" className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> My Businesses
      </Link>
      <PageHeader title="New merchant" description="One merchant per website. You get the API keys immediately." />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_260px]">
        <Card className="p-6">
          <NewMerchantForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
        </Card>
        <div className="rounded-2xl bg-forest-900 p-5 text-white">
          <KeyRound className="mb-3 size-6 text-lime-300" />
          <div className="text-[15px] font-bold">What you get</div>
          <ul className="mt-2 space-y-2 text-[13.5px] text-white/75">
            <li>
              • A public <b className="text-white">merchant_id</b> (7 digits)
            </li>
            <li>
              • A private <b className="text-white">secret key</b> to sign requests
            </li>
            <li>• Ready-to-copy code for your website</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
