import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { ProviderPayment, ProviderReference } from "../types";
import { vismaCall, vismaRefused } from "./visma-request";

const PaymentAnswerSchema = z.object({ Id: z.string().nullish() }).passthrough();

export type RegisterVismaPaymentInput = {
  accessToken: string;
  invoiceId: string;
  payment: ProviderPayment;
};

/**
 * POST `/customerinvoices/{id}/payments`: books a payment Bibi took elsewhere (card, Swish) on the
 * invoice, which lowers its remaining amount. The reference is Visma's id when it answers one,
 * else Bibi's own (the invoice and Bibi's payment id), unique within the connection.
 * // Verify against Visma sandbox (required fields, the bank account, the answer's shape)
 */
export async function registerVismaPayment({
  accessToken,
  invoiceId,
  payment,
}: RegisterVismaPaymentInput): Promise<Result<ProviderReference>> {
  const amount = payment.amountMinor / 100;
  const body = {
    PaymentDate: payment.paidAt.toISOString().slice(0, 10),
    PaymentAmount: amount,
    PaymentCurrencyAmount: amount,
  };
  const path = `/customerinvoices/${encodeURIComponent(invoiceId)}/payments`;
  const sent = await vismaCall({ method: "POST", path, accessToken, body });
  if (!sent.ok) return sent;
  if (sent.value.status !== 200 && sent.value.status !== 201) {
    return vismaRefused({ what: "the payment", response: sent.value });
  }
  const parsed = PaymentAnswerSchema.safeParse(sent.value.json);
  const id = parsed.success ? parsed.data.Id : null;
  return ok({ value: { providerReference: id ?? `${invoiceId}:registered:${payment.reference}` } });
}
