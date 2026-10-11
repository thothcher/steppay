// POST /api/status/order_id — ask the gateway for the current state of an order.
import { apiRoute, authenticate, preflight, success } from "@/lib/api";
import { GatewayError, paymentByOrderId, responseParams } from "@/lib/gateway";

export const OPTIONS = preflight;

export const POST = apiRoute("status/order_id", async (params, _req, setMerchant) => {
  const { merchant } = await authenticate(params, { allowUnsigned: false });
  setMerchant(merchant);
  if (!params.order_id) throw new GatewayError(1001, "Required parameter is missing: order_id");
  const payment = await paymentByOrderId(merchant, params.order_id);
  if (!payment) {
    throw new GatewayError(1012, `Order "${String(params.order_id)}" not found for merchant ${merchant.merchant_id}`);
  }
  return success(responseParams(payment, merchant));
});
