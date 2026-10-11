// Helpers shared by the public API routes in src/app/api/*.
// Like Flitt, requests and responses are wrapped:  { "request": {...} }  →  { "response": {...} }
// and the HTTP status is always 200 — check `response_status` ("success" | "failure").

import { NextResponse } from "next/server";
import { sql } from "./db";
import { GatewayError, merchantByPublicId, type Merchant } from "./gateway";
import { maskedSignatureString, verify } from "./signature";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-StepPay-Client",
  "Access-Control-Max-Age": "86400",
};

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export type Params = Record<string, unknown>;

export async function readParams(req: Request): Promise<Params> {
  const type = req.headers.get("content-type") || "";
  const text = await req.text();
  let body: unknown = {};
  if (type.includes("application/x-www-form-urlencoded")) {
    body = Object.fromEntries(new URLSearchParams(text));
  } else if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new GatewayError(1000, 'Request body is not valid JSON. Send: {"request": { ...parameters... }}');
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new GatewayError(1000, 'Request body must be a JSON object: {"request": { ...parameters... }}');
  }
  const obj = body as Params;
  return obj.request && typeof obj.request === "object" ? (obj.request as Params) : obj;
}

/** Finds the merchant and checks the signature. */
export async function authenticate(params: Params, opts: { allowUnsigned: boolean }): Promise<{ merchant: Merchant; signed: boolean }> {
  if (params.merchant_id === undefined || params.merchant_id === "") {
    throw new GatewayError(1001, "Required parameter is missing: merchant_id");
  }
  const merchant = await merchantByPublicId(params.merchant_id);
  if (!merchant) {
    throw new GatewayError(1002, `Merchant ${String(params.merchant_id)} not found. Copy merchant_id from Merchant settings.`);
  }
  const signature = String(params.signature ?? "").trim();
  if (!signature) {
    if (opts.allowUnsigned && merchant.allow_unsigned) return { merchant, signed: false };
    throw new GatewayError(
      1001,
      opts.allowUnsigned
        ? "Required parameter is missing: signature (unsigned frontend payments are switched off for this merchant)"
        : "Required parameter is missing: signature",
    );
  }
  if (!verify(merchant.secret_key, params)) {
    throw new GatewayError(1014, "Invalid signature. Compare your signature string with request_signature_string.", {
      request_signature_string: maskedSignatureString(params),
    });
  }
  return { merchant, signed: true };
}

export function success(data: Params) {
  return NextResponse.json({ response: { response_status: "success", ...data } }, { headers: CORS_HEADERS });
}

export function failure(err: unknown) {
  const e = err instanceof GatewayError ? err : new GatewayError(1099, "Internal gateway error. Try again; if it repeats, tell your lecturer.");
  if (!(err instanceof GatewayError)) console.error(err);
  return NextResponse.json(
    { response: { response_status: "failure", error_code: e.code, error_message: e.message, ...e.extra } },
    { headers: CORS_HEADERS },
  );
}

/** Writes every API call to the developer log shown in the portal. */
async function logApiCall(endpoint: string, req: Request, params: Params, response: NextResponse, merchant: Merchant | null) {
  try {
    const body = await response.clone().json();
    const r = body.response ?? {};
    await sql(
      `INSERT INTO api_logs (merchant_ref, merchant_id, endpoint, request_body, response_body, success, error_code, origin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        merchant?.id ?? null,
        String(params.merchant_id ?? "").slice(0, 40),
        endpoint,
        JSON.stringify(params, null, 2).slice(0, 8000),
        JSON.stringify(body, null, 2).slice(0, 8000),
        r.response_status === "success",
        r.error_code ?? null,
        (req.headers.get("origin") || req.headers.get("referer") || "server").slice(0, 200),
      ],
    );
  } catch (e) {
    console.error("api log failed", e);
  }
}

/** Wraps a route: parses params, handles errors, writes the developer log. */
export function apiRoute(endpoint: string, handler: (params: Params, req: Request, setMerchant: (m: Merchant) => void) => Promise<NextResponse>) {
  return async function POST(req: Request) {
    let params: Params = {};
    let merchant: Merchant | null = null;
    let res: NextResponse;
    try {
      params = await readParams(req);
      res = await handler(params, req, (m) => (merchant = m));
    } catch (err) {
      res = failure(err);
    }
    if (!merchant && params.merchant_id) merchant = await merchantByPublicId(params.merchant_id).catch(() => null);
    await logApiCall(endpoint, req, params, res, merchant);
    return res;
  };
}
