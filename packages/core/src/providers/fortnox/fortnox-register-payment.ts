import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { ProviderPayment, ProviderReference } from "../types";
import { fortnoxRefused, fortnoxSend } from "./fortnox-request";

const RegisteredSchema = z.object({ InvoicePayment: z.object({ Number: z.coerce.string() }) });

export type RegisterFortnoxPaymentInput = {
  accessToken: string;
  /** The invoice's document number. */
  documentNumber: string;
  payment: ProviderPayment;
};

/**
 * Books a payment another provider took (card, Swish) on a Fortnox invoice (ADR 0100, 0106):
 * creates the invoice payment, then bookkeeps it so the invoice reads as paid. Returns Fortnox's
 * payment number, the same reference `listPayments` reports, so a sync adds nothing.
 */
export async function registerFortnoxPayment({
  accessToken,
  documentNumber,
  payment,
}: RegisterFortnoxPaymentInput): Promise<Result<ProviderReference>> {
  const body = {
    InvoicePayment: {
      InvoiceNumber: Number(documentNumber),
      Amount: payment.amountMinor / 100,
      PaymentDate: payment.paidAt.toISOString().slice(0, 10),
      ExternalInvoiceReference1: payment.reference.slice(0, 80),
    },
  };
  const created = await fortnoxSend({
    method: "POST",
    path: "/invoicepayments",
    accessToken,
    body,
  });
  if (!created.ok) return created;
  const parsed = RegisteredSchema.safeParse(created.value.json);
  if (created.value.status !== 201 || !parsed.success) {
    return fortnoxRefused({ what: "the payment", response: created.value });
  }
  const number = parsed.data.InvoicePayment.Number;
  const path = `/invoicepayments/${encodeURIComponent(number)}/bookkeep`;
  const booked = await fortnoxSend({ method: "PUT", path, accessToken });
  if (!booked.ok) return booked;
  if (booked.value.status !== 200) {
    return fortnoxRefused({ what: "the payment's bookkeeping", response: booked.value });
  }
  return ok({ value: { providerReference: number } });
}
