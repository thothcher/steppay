import { createHash } from "node:crypto";

// The signature algorithm (same idea as Flitt / Fondy "v1.0" protocol):
//
//   1. Take every request parameter except `signature` itself.
//   2. Drop parameters with empty values ("", null, undefined) and objects.
//   3. Sort the remaining parameters alphabetically by NAME.
//   4. Join  SECRET_KEY | value1 | value2 | ...  with the "|" character.
//   5. signature = sha1(that string) as lowercase hex.

type Params = Record<string, unknown>;

const EXCLUDED = new Set(["signature", "response_signature_string"]);

export function signatureValues(params: Params): string[] {
  return Object.keys(params)
    .filter((key) => !EXCLUDED.has(key))
    .sort()
    .map((key) => params[key])
    .filter((v) => v !== undefined && v !== null && typeof v !== "object" && String(v) !== "")
    .map((v) => String(v));
}

export function signatureString(secret: string, params: Params): string {
  return [secret, ...signatureValues(params)].join("|");
}

export function sign(secret: string, params: Params): string {
  return createHash("sha1").update(signatureString(secret, params), "utf8").digest("hex");
}

/** Same string with the secret replaced by stars — safe to show in error messages. */
export function maskedSignatureString(params: Params): string {
  return ["**********", ...signatureValues(params)].join("|");
}

export function verify(secret: string, params: Params): boolean {
  const given = String(params.signature ?? "").toLowerCase();
  return given.length > 0 && given === sign(secret, params);
}
