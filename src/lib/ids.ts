import { randomBytes, randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** URL-safe random string from an unambiguous alphabet. */
export function randomId(length = 24): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function randomDigits(length: number): string {
  let out = String(randomInt(1, 10));
  while (out.length < length) out += String(randomInt(0, 10));
  return out;
}

/** Secret key a merchant uses to sign requests. */
export function newSecretKey(): string {
  return "sk_test_" + randomId(32);
}
