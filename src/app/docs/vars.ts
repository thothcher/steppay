import { getUser } from "@/lib/auth";
import { sqlOne } from "@/lib/db";
import { getBaseUrl } from "@/lib/url";
import type { SnippetVars } from "@/lib/snippets";

/** Code samples use the reader's real keys when they are signed in. */
export async function docVars(): Promise<SnippetVars & { personal: boolean }> {
  const base = await getBaseUrl();
  const user = await getUser();
  if (user) {
    const m = await sqlOne<{ merchant_id: number; secret_key: string }>(
      "SELECT merchant_id, secret_key FROM merchants WHERE user_id = $1 AND active ORDER BY created_at LIMIT 1",
      [user.id],
    );
    if (m) return { base, merchantId: String(m.merchant_id), secret: m.secret_key, personal: true };
  }
  return { base, merchantId: "1234567", secret: "sk_test_YOUR_SECRET_KEY", personal: false };
}
