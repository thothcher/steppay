// POST /api/checkout/url — create a payment and get the hosted checkout link.
import { apiRoute, authenticate, preflight, success } from "@/lib/api";
import { createOrder } from "@/lib/gateway";
import { getBaseUrl } from "@/lib/url";

export const OPTIONS = preflight;

export const POST = apiRoute("checkout/url", async (params, req, setMerchant) => {
  const { merchant, signed } = await authenticate(params, { allowUnsigned: true });
  setMerchant(merchant);
  const client = req.headers.get("x-steppay-client");
  const source = client === "playground" ? "playground" : signed ? "api" : "sdk";
  const payment = await createOrder(merchant, params, { source, signed });
  const base = await getBaseUrl();
  return success({
    checkout_url: `${base}/checkout/${payment.token}`,
    payment_id: payment.payment_id,
    order_id: payment.order_id,
  });
});
