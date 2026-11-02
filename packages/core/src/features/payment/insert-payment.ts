import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { loadChargeTarget } from "./payment-preconditions";
import { newPublicToken } from "./public-token";
import { claimReceivable, loadReceivable, type Receivable } from "./receivable";
import { applicationFee } from "./request-charge";
import type { PaymentCreateInput, PaymentDto } from "./schema";
import { paidByReceivable, settlementOf } from "./settlement";
import { toPaymentDto } from "./to-payment-dto";

type AmountInput = {
  context: Pick<OperationContext, "db">;
  receivable: Receivable;
  input: PaymentCreateInput;
};

/** The requested amount: the open balance by default, lower for a partial payment, never higher. */
async function chargeAmount({ context, receivable, input }: AmountInput): Promise<Result<number>> {
  const paid = await paidByReceivable({ context, ticketIds: [receivable.ticketId] });
  const id = receivable.ref.quoteId ?? receivable.ref.depositId ?? receivable.ref.invoiceId ?? "";
  const { openMinor } = settlementOf({ paid, id, amountMinor: receivable.amountMinor });
  if (openMinor <= 0) return conflict({ message: "Nothing is left to pay on it" });
  if (input.amountMinor === undefined) return ok({ value: openMinor });
  if (input.amountMinor <= openMinor) return ok({ value: input.amountMinor });
  const message = `The amount is more than the open balance (${openMinor} minor units)`;
  return invalid({ message, issues: [{ path: "amountMinor", message }] });
}

export type InsertPaymentInput = {
  context: Pick<
    OperationContext,
    "db" | "organizationId" | "actor" | "recordChange" | "permissions"
  >;
  input: PaymentCreateInput;
};

/**
 * The PENDING payment row against one receivable (`payment.create`, `deposit.request`). Stripe is
 * called only after it committed, by the operation's `external` (`chargeAfterCommit`, ADR 0058).
 */
export async function insertPayment({
  context,
  input,
}: InsertPaymentInput): Promise<Result<PaymentDto>> {
  const receivable = await loadReceivable({ context, input });
  if (!receivable.ok) return receivable;
  const { ticketId, ref, currency } = receivable.value;
  const target = await loadChargeTarget({ context, ticketId, method: input.method });
  if (!target.ok) return err({ error: target.error });
  const claimed = await claimReceivable({ context, ref });
  if (!claimed.ok) return claimed;
  const amount = await chargeAmount({ context, receivable: receivable.value, input });
  if (!amount.ok) return amount;
  // The row comes first; Stripe is called only after it committed (`external`, ADR 0058).
  const row = await context.db.payment.create({
    data: {
      ...ref,
      publicToken: newPublicToken(),
      organizationId: context.organizationId,
      ticketId,
      method: input.method,
      amountMinor: amount.value,
      currency,
      applicationFeeMinor: applicationFee({ amountMinor: amount.value }) ?? null,
      providerAccountId: target.value.connectedAccountId,
      createdBy: context.actor.userId,
    },
  });
  const payment = toPaymentDto({ row });
  // Audit images are DTOs: the public token and the connected account id never enter them.
  context.recordChange({ entityId: row.id, after: payment });
  return ok({ value: payment });
}
