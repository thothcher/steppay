// POST /api/reverse/order_id — refund an approved payment (fully or partially).
import { apiRoute, authenticate, preflight, success } from "@/lib/api";
import { GatewayError, paymentByOrderId, refundPayment } from "@/lib/gateway";
import { sign } from "@/lib/signature";

export const OPTIONS = preflight;

export const POST = apiRoute("reverse/order_id", async (params, _req, setMerchant) => {
  const { merchant } = await authenticate(params, { allowUnsigned: false });
  setMerchant(merchant);
  for (const f of ["order_id", "amount", "currency"]) {
    if (params[f] === undefined || params[f] === "") throw new GatewayError(1001, `Required parameter is missing: ${f}`);
  }
  const payment = await paymentByOrderId(merchant, params.order_id);
  if (!payment) {
    throw new GatewayError(1012, `Order "${String(params.order_id)}" not found for merchant ${merchant.merchant_id}`);
  }
  if (String(params.currency).toUpperCase() !== payment.currency) {
    throw new GatewayError(1005, `Currency must match the order currency (${payment.currency})`);
  }
  if (!/^\d+$/.test(String(params.amount))) {
    throw new GatewayError(1004, "Parameter `amount` must be a whole number in minor units");
  }
  const updated = await refundPayment(payment, merchant, Number(params.amount), String(params.comment ?? ""), "api");
  const data = {
    order_id: updated.order_id,
    merchant_id: merchant.merchant_id,
    reverse_status: "approved",
    reversal_amount: Number(params.amount),
    total_reversal_amount: updated.reversal_amount,
    order_status: updated.status,
    currency: updated.currency,
    response_status: "success",
  };
  return success({ ...data, signature: sign(merchant.secret_key, data) });
});
