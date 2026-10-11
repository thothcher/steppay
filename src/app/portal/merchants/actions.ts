"use server";

import { redirect } from "next/navigation";
import { refresh, revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { newSecretKey } from "@/lib/ids";
import { insertMerchant, normalizeUrl } from "@/lib/merchants";
import { ownedMerchant } from "@/lib/portal";
import { isHttpUrl } from "@/lib/url";

export type FormState = { error?: string; ok?: string };

export async function createMerchant(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  const url = normalizeUrl(String(form.get("url") ?? ""));
  const companyField = String(form.get("company_id") ?? "");
  if (name.length < 2) return { error: "Give your merchant a name (for example: Pizza Step online)." };
  if (String(form.get("url") ?? "").trim() && !url) return { error: "Website URL looks wrong. Example: https://my-shop.netlify.app" };

  let companyId: number | null = null;
  if (companyField === "new" || !companyField) {
    const companyName = String(form.get("company_name") ?? "").trim() || name;
    const c = await sqlOne<{ id: number }>("INSERT INTO companies (user_id, name) VALUES ($1, $2) RETURNING id", [
      user.id,
      companyName.slice(0, 120),
    ]);
    companyId = c!.id;
  } else {
    const c = await sqlOne<{ id: number }>("SELECT id FROM companies WHERE id = $1 AND user_id = $2", [Number(companyField), user.id]);
    if (!c) return { error: "Company not found." };
    companyId = c.id;
  }

  const id = await insertMerchant(user.id, companyId, name.slice(0, 120), url);
  revalidatePath("/portal", "layout");
  redirect(`/portal/merchants/${id}?created=1`);
}

export async function updateMerchant(id: number, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const m = await ownedMerchant(user, id);
  const name = String(form.get("name") ?? "").trim();
  const urlRaw = String(form.get("url") ?? "").trim();
  const url = normalizeUrl(urlRaw);
  const callback = String(form.get("callback_url") ?? "").trim();
  const allowUnsigned = form.get("allow_unsigned") === "on";
  if (name.length < 2) return { error: "Name is too short." };
  if (urlRaw && !url) return { error: "Website URL looks wrong." };
  if (callback && !isHttpUrl(callback)) return { error: "Callback URL must start with http:// or https://" };
  await sql("UPDATE merchants SET name = $2, url = $3, callback_url = $4, allow_unsigned = $5 WHERE id = $1", [
    m.id,
    name.slice(0, 120),
    url,
    callback,
    allowUnsigned,
  ]);
  refresh();
  return { ok: "Settings saved." };
}

export async function regenerateSecret(id: number) {
  const user = await requireUser();
  const m = await ownedMerchant(user, id);
  await sql("UPDATE merchants SET secret_key = $2 WHERE id = $1", [m.id, newSecretKey()]);
  refresh();
}

export async function toggleMerchant(id: number) {
  const user = await requireUser();
  const m = await ownedMerchant(user, id);
  await sql("UPDATE merchants SET active = NOT active WHERE id = $1", [m.id]);
  refresh();
}

export async function deleteMerchant(id: number): Promise<FormState> {
  const user = await requireUser();
  const m = await ownedMerchant(user, id);
  const used = await sqlOne<{ n: number }>("SELECT count(*)::int AS n FROM payments WHERE merchant_ref = $1", [m.id]);
  if (used && used.n > 0) {
    return { error: `This merchant has ${used.n} payment(s). Disable it instead — the history must stay for reports.` };
  }
  await sql("DELETE FROM merchants WHERE id = $1", [m.id]);
  revalidatePath("/portal", "layout");
  redirect("/portal/merchants");
}
