// POST /api/capture/order_id — capture a payment created with preauth = "Y".
import { apiRoute, authenticate, preflight, success } from "@/lib/api";
import { GatewayError, capturePayment, paymentByOrderId } from "@/lib/gateway";
import { sign } from "@/lib/signature";

export const OPTIONS = preflight;

export const POST = apiRoute("capture/order_id", async (params, _req, setMerchant) => {
  const { merchant } = await authenticate(params, { allowUnsigned: false });
  setMerchant(merchant);
  if (!params.order_id) throw new GatewayError(1001, "Required parameter is missing: order_id");
  const payment = await paymentByOrderId(merchant, params.order_id);
  if (!payment) {
    throw new GatewayError(1012, `Order "${String(params.order_id)}" not found for merchant ${merchant.merchant_id}`);
  }
  if (params.amount !== undefined && String(params.amount) !== String(payment.amount)) {
    throw new GatewayError(1004, `Partial capture is not supported in the sandbox. Send amount = ${payment.amount}`);
  }
  const updated = await capturePayment(payment, merchant);
  const data = {
    order_id: updated.order_id,
    merchant_id: merchant.merchant_id,
    capture_status: "captured",
    capture_amount: updated.amount,
    currency: updated.currency,
    order_status: updated.status,
    response_status: "success",
  };
  return success({ ...data, signature: sign(merchant.secret_key, data) });
});
