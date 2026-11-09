import { ok, type Result } from "../../errors/result";
import { notFound } from "../../shared/errors";
import { SWISH_CURRENCY, swishCallbackUrl } from "./swish-config";
import type { SwishCredentials } from "./swish-credentials";
import { swishAmount, swishMessage, swishReference } from "./swish-format";
import { swishCall, swishRefused } from "./swish-request";
import {
  type SwishPaymentRequest,
  SwishPaymentRequestSchema,
  type SwishRefund,
  SwishRefundSchema,
} from "./swish-types";

type Authed = { credentials: SwishCredentials };
type ById = Authed & { id: string };

export type CreateRequestInput = ById & {
  amountMinor: number;
  message: string;
  payeePaymentReference: string;
};

/**
 * PUT `/api/v2/paymentrequests/{id}` for m-commerce and QR (no payer alias): Swish answers 201
 * with a `PaymentRequestToken` header, the token the app or QR code opens. Returns it.
 */
export async function createPaymentRequest({
  credentials,
  id,
  amountMinor,
  message,
  payeePaymentReference,
}: CreateRequestInput): Promise<Result<string>> {
  const body = {
    payeePaymentReference: swishReference({ value: payeePaymentReference }),
    callbackUrl: swishCallbackUrl(),
    payeeAlias: credentials.swishNumber,
    amount: swishAmount({ minor: amountMinor }),
    currency: SWISH_CURRENCY,
    message: swishMessage({ text: message }),
  };
  const path = `/api/v2/paymentrequests/${id}`;
  const sent = await swishCall({ credentials, method: "PUT", path, body });
  if (!sent.ok) return sent;
  const token = sent.value.headers.paymentrequesttoken;
  if (sent.value.status !== 201 || !token) {
    return swishRefused({ what: "the payment request", response: sent.value });
  }
  return ok({ value: token });
}

/** GET `/api/v1/paymentrequests/{id}`: the request's state now. NOT_FOUND when Swish has none. */
export async function readPaymentRequest({
  credentials,
  id,
}: ById): Promise<Result<SwishPaymentRequest>> {
  const path = `/api/v1/paymentrequests/${encodeURIComponent(id)}`;
  const sent = await swishCall({ credentials, method: "GET", path });
  if (!sent.ok) return sent;
  if (sent.value.status === 404) return notFound({ entity: "Swish payment request" });
  const parsed = SwishPaymentRequestSchema.safeParse(sent.value.json);
  if (sent.value.status !== 200 || !parsed.success) {
    return swishRefused({ what: "the payment request lookup", response: sent.value });
  }
  return ok({ value: parsed.data });
}

/** PATCH `/api/v1/paymentrequests/{id}` to `cancelled` (JSON Patch); only a CREATED request. */
export async function cancelPaymentRequest({ credentials, id }: ById): Promise<Result<true>> {
  const path = `/api/v1/paymentrequests/${encodeURIComponent(id)}`;
  const body = [{ op: "replace", path: "/status", value: "cancelled" }];
  const contentType = "application/json-patch+json";
  const sent = await swishCall({ credentials, method: "PATCH", path, body, contentType });
  if (!sent.ok) return sent;
  if (sent.value.status !== 200) return swishRefused({ what: "the cancel", response: sent.value });
  return ok({ value: true });
}

export type CreateRefundInput = ById & {
  originalPaymentReference: string;
  amountMinor: number;
  payerPaymentReference: string;
  message: string;
};

/** PUT `/api/v2/refunds/{id}` from the venue's Swish number back to the payer of the original. */
export async function createRefund({
  credentials,
  id,
  originalPaymentReference,
  amountMinor,
  payerPaymentReference,
  message,
}: CreateRefundInput): Promise<Result<true>> {
  const body = {
    originalPaymentReference,
    payerPaymentReference: swishReference({ value: payerPaymentReference }),
    callbackUrl: swishCallbackUrl(),
    payerAlias: credentials.swishNumber,
    amount: swishAmount({ minor: amountMinor }),
    currency: SWISH_CURRENCY,
    message: swishMessage({ text: message }),
  };
  const sent = await swishCall({ credentials, method: "PUT", path: `/api/v2/refunds/${id}`, body });
  if (!sent.ok) return sent;
  if (sent.value.status !== 201) return swishRefused({ what: "the refund", response: sent.value });
  return ok({ value: true });
}

/** GET `/api/v1/refunds/{id}`: the refund's state now. */
export async function readRefund({ credentials, id }: ById): Promise<Result<SwishRefund>> {
  const path = `/api/v1/refunds/${encodeURIComponent(id)}`;
  const sent = await swishCall({ credentials, method: "GET", path });
  if (!sent.ok) return sent;
  if (sent.value.status === 404) return notFound({ entity: "Swish refund" });
  const parsed = SwishRefundSchema.safeParse(sent.value.json);
  if (sent.value.status !== 200 || !parsed.success) {
    return swishRefused({ what: "the refund lookup", response: sent.value });
  }
  return ok({ value: parsed.data });
}
