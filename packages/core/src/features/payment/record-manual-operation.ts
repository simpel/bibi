import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { closeOpenAttempts } from "./close-attempts";
import { guardLedgerInvoice } from "./insert-payment";
import { type PaymentRecordManualInput, PaymentRecordManualInputSchema } from "./lifecycle-schema";
import { newPublicToken } from "./public-token";
import { claimReceivable, loadReceivable } from "./receivable";
import { registerOnInvoice } from "./register-on-invoice";
import { type PaymentDto, PaymentSchema } from "./schema";
import { paidByReceivable, settlementOf } from "./settlement";
import { toPaymentDto } from "./to-payment-dto";

type RecordInput = { context: OperationContext; input: PaymentRecordManualInput };

/** A SUCCEEDED MANUAL payment against one receivable, at most its open balance. */
async function recordManual({ context, input }: RecordInput): Promise<Result<PaymentDto>> {
  const receivable = await loadReceivable({ context, input });
  if (!receivable.ok) return receivable;
  const { orderId, ref, currency, amountMinor } = receivable.value;
  const guarded = await guardLedgerInvoice({
    context,
    invoiceId: ref.invoiceId,
    depositId: ref.depositId,
  });
  if (!guarded.ok) return guarded;
  const claimed = await claimReceivable({ context, ref });
  if (!claimed.ok) return claimed;
  const paid = await paidByReceivable({ context, orderIds: [orderId] });
  const id = ref.quoteId ?? ref.depositId ?? ref.invoiceId ?? "";
  const { openMinor } = settlementOf({ paid, id, amountMinor });
  if (openMinor <= 0) return conflict({ message: "Nothing is left to pay on it" });
  if (input.amountMinor > openMinor) {
    const message = `The amount is more than the open balance (${openMinor} minor units)`;
    return invalid({ message, issues: [{ path: "amountMinor", message }] });
  }
  const row = await context.db.payment.create({
    data: {
      ...ref,
      organizationId: context.organizationId,
      orderId,
      method: "MANUAL",
      status: "SUCCEEDED",
      amountMinor: input.amountMinor,
      currency,
      paidAt: input.paidAt,
      note: input.note ?? null,
      publicToken: newPublicToken(),
      createdBy: context.actor.userId,
    },
  });
  const payment = toPaymentDto({ row: { ...row, attempts: [], refunds: [] } });
  context.recordChange({ entityId: row.id, after: payment });
  return ok({ value: payment });
}

export const recordManualPayment = defineOperation({
  name: "payment.recordManual",
  kind: "command",
  description:
    "Record money the customer paid outside Bibi's providers, e.g. a bank transfer or cash " +
    "(ADR 0100): a SUCCEEDED MANUAL payment against exactly one receivable (depositId or " +
    "invoiceId), at most its open balance. Once nothing is left open, the open card or Swish " +
    "attempts on it are closed at their providers. An invoice raised in an accounting system that " +
    "can book payments gets the payment booked there too; one that cannot refuses it with " +
    "CONFLICT: record it in that system instead.",
  input: PaymentRecordManualInputSchema,
  output: PaymentSchema,
  permission: "payment:write",
  handler: ({ input, context }) => recordManual({ context, input }),
  external: async ({ output, context }) => {
    await closeOpenAttempts({ context, paymentId: output.id });
    const registered = await registerOnInvoice({ context, paymentId: output.id });
    return registered.ok ? ok({ value: output }) : registered;
  },
});
