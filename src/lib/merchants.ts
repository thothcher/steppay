import { sql, sqlOne } from "./db";
import { newSecretKey, randomDigits } from "./ids";
import { isHttpUrl } from "./url";

/** Creates a merchant with a fresh unique 7-digit merchant_id and secret key. */
export async function insertMerchant(userId: number, companyId: number | null, name: string, url: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const merchantId = Number(randomDigits(7));
    const row = await sqlOne<{ id: number }>(
      `INSERT INTO merchants (merchant_id, user_id, company_id, name, url, secret_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (merchant_id) DO NOTHING RETURNING id`,
      [merchantId, userId, companyId, name, url, newSecretKey()],
    );
    if (row) return row.id;
  }
  throw new Error("Could not generate a unique merchant_id");
}

export function normalizeUrl(input: string): string {
  const v = input.trim();
  if (!v) return "";
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return isHttpUrl(withProto) ? withProto.replace(/\/+$/, "") : "";
}

export async function companiesOf(userId: number) {
  return sql<{
    id: number;
    name: string;
    legal_form: string;
    tax_id: string;
    address: string;
    director_name: string;
    director_personal_id: string;
    director_birth_date: string;
    iban: string;
    bank_name: string;
    account_holder: string;
    onboarding_step: number;
    status: string;
    activated_at: Date | null;
    created_at: Date;
    merchants: number;
  }>(
    `SELECT c.*, (SELECT count(*) FROM merchants m WHERE m.company_id = c.id)::int AS merchants
       FROM companies c WHERE c.user_id = $1 ORDER BY c.created_at`,
    [userId],
  );
}
