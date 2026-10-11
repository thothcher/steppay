"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { insertMerchant, normalizeUrl } from "@/lib/merchants";
import { notify } from "@/lib/notify";

export type StepState = { error?: string };

async function ownCompany(userId: number, id: number) {
  const c = await sqlOne<{ id: number; onboarding_step: number }>("SELECT id, onboarding_step FROM companies WHERE id = $1 AND user_id = $2", [
    id,
    userId,
  ]);
  if (!c) throw new Error("Company not found");
  return c;
}

const get = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** Step 1 — company information (+ the first merchant for a new company). */
export async function saveCompany(companyId: number | null, _prev: StepState, form: FormData): Promise<StepState> {
  const user = await requireUser();
  const name = get(form, "name");
  const legalForm = get(form, "legal_form");
  const taxId = get(form, "tax_id");
  const address = get(form, "address");
  if (name.length < 2) return { error: "Enter the company name." };
  if (!/^\d{9,11}$/.test(taxId)) return { error: "Tax ID must be 9–11 digits (invent one — this is a sandbox)." };
  if (address.length < 4) return { error: "Enter the legal address." };

  if (companyId) {
    const c = await ownCompany(user.id, companyId);
    await sql("UPDATE companies SET name=$2, legal_form=$3, tax_id=$4, address=$5, onboarding_step=GREATEST(onboarding_step, 2) WHERE id=$1", [
      c.id,
      name,
      legalForm,
      taxId,
      address,
    ]);
    revalidatePath("/portal", "layout");
    redirect(`/portal/activation?company=${c.id}`);
  }

  const merchantName = get(form, "merchant_name") || name;
  const merchantUrlRaw = get(form, "merchant_url");
  const merchantUrl = normalizeUrl(merchantUrlRaw);
  if (merchantUrlRaw && !merchantUrl) return { error: "Website URL looks wrong. Example: https://my-shop.netlify.app" };

  const company = await sqlOne<{ id: number }>(
    `INSERT INTO companies (user_id, name, legal_form, tax_id, address, onboarding_step) VALUES ($1,$2,$3,$4,$5,2) RETURNING id`,
    [user.id, name.slice(0, 120), legalForm, taxId, address.slice(0, 200)],
  );
  await insertMerchant(user.id, company!.id, merchantName.slice(0, 120), merchantUrl);
  await notify(user.id, {
    kind: "success",
    title: "Merchant created",
    body: `${merchantName} has API keys and can accept test payments right now.`,
    link: "/portal/merchants",
  });
  revalidatePath("/portal", "layout");
  redirect(`/portal/activation?company=${company!.id}`);
}

/** Step 2 — director identification. */
export async function saveDirector(companyId: number, _prev: StepState, form: FormData): Promise<StepState> {
  const user = await requireUser();
  const c = await ownCompany(user.id, companyId);
  const directorName = get(form, "director_name");
  const personalId = get(form, "director_personal_id");
  const birth = get(form, "director_birth_date");
  if (directorName.length < 4) return { error: "Enter the director's full name." };
  if (!/^\d{11}$/.test(personalId)) return { error: "Personal ID must be exactly 11 digits (use a made-up one, e.g. 01001012345)." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { error: "Choose a date of birth." };
  if (form.get("confirm") !== "on") return { error: "Please confirm that you used test data only." };
  await sql(
    "UPDATE companies SET director_name=$2, director_personal_id=$3, director_birth_date=$4, onboarding_step=GREATEST(onboarding_step, 3) WHERE id=$1",
    [c.id, directorName, personalId, birth],
  );
  redirect(`/portal/activation?company=${c.id}`);
}

/** Step 3 — settlement bank account. */
export async function saveIban(companyId: number, _prev: StepState, form: FormData): Promise<StepState> {
  const user = await requireUser();
  const c = await ownCompany(user.id, companyId);
  const iban = get(form, "iban").replace(/\s+/g, "").toUpperCase();
  const bank = get(form, "bank_name");
  const holder = get(form, "account_holder");
  if (!/^GE\d{2}[A-Z]{2}\d{16}$/.test(iban)) {
    return { error: "IBAN must look like GE29SB0000000000000001 (GE + 2 digits + 2 letters + 16 digits)." };
  }
  if (!bank) return { error: "Choose a bank." };
  if (holder.length < 2) return { error: "Enter the account holder." };
  await sql("UPDATE companies SET iban=$2, bank_name=$3, account_holder=$4, onboarding_step=GREATEST(onboarding_step, 4) WHERE id=$1", [
    c.id,
    iban,
    bank,
    holder,
  ]);
  redirect(`/portal/activation?company=${c.id}`);
}

/** Step 4 — review & approve (automatic in the sandbox). */
export async function activateCompany(companyId: number) {
  const user = await requireUser();
  const c = await ownCompany(user.id, companyId);
  if (c.onboarding_step < 4) redirect(`/portal/activation?company=${c.id}`);
  await sql("UPDATE companies SET status='activated', onboarding_step=5, activated_at=now() WHERE id=$1", [c.id]);
  await notify(user.id, {
    kind: "success",
    title: "Business activated 🎉",
    body: "Your merchants are activated. Approved payments are now settled to your IBAN every day.",
    link: "/portal/settlements",
  });
  revalidatePath("/portal", "layout");
  redirect(`/portal/activation?company=${c.id}&done=1`);
}
