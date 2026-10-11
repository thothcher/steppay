import { headers } from "next/headers";

/** Public base URL of this deployment, e.g. https://steppay.vercel.app */
export async function getBaseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** True for localhost and private network addresses that the internet cannot reach. */
export function isPrivateUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host === "0.0.0.0" ||
      host === "::1" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^f[cd][0-9a-f]{2}:/.test(host) ||
      /^fe80:/.test(host)
    );
  } catch {
    return true;
  }
}
