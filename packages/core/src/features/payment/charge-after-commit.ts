import { err, ok, type Result } from "../../errors/result";
import type { ExternalInput } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { type ChargeTarget, loadChargeTarget } from "./payment-preconditions";
import { loadReceivable } from "./receivable";
import { requestCharge } from "./request-charge";
import type { PaymentCreateInput, PaymentDto } from "./schema";
import { toPaymentDto } from "./to-payment-dto";

export type ChargeAfterCommitInput = ExternalInput<PaymentCreateInput, PaymentDto>;

type PreparedCharge = { target: ChargeTarget; description: string };

/** The ticket, customer and account again, and the text the customer sees on the charge. */
async function prepare({
  input,
  context,
}: ChargeAfterCommitInput): Promise<Result<PreparedCharge>> {
  const receivable = await loadReceivable({ context, input });
  if (!receivable.ok) return receivable;
  const { ticketId, description } = receivable.value;
  const target = await loadChargeTarget({ context, ticketId, method: input.method });
  if (!target.ok) return target;
  return ok({ value: { target: target.value, description: input.description ?? description } });
}

/**
 * `payment.create`'s call to Stripe, run by `execute` once the PENDING row is committed and never
 * by a change preview (ADR 0058). The row id is the idempotency key, so a retry for the same row
 * returns the same checkout or invoice. The amount is the row's. A refused charge leaves the row
 * FAILED.
 */
export async function chargeAfterCommit({
  input,
  output,
  context,
}: ChargeAfterCommitInput): Promise<Result<PaymentDto>> {
  const row = await context.db.payment.findFirst({ where: { id: output.id } });
  if (!row) return notFound({ entity: "Payment" });
  const prepared = await prepare({ input, output, context });
  const charge = prepared.ok
    ? await requestCharge({
        paymentId: row.id,
        publicToken: row.publicToken,
        organizationId: context.organizationId,
        input: { ...row, description: prepared.value.description },
        target: { ...prepared.value.target, connectedAccountId: row.providerAccountId },
        applicationFeeMinor: row.applicationFeeMinor ?? undefined,
      })
    : prepared;
  const data = charge.ok
    ? {
        providerReference: charge.value.providerReference,
        paymentUrl: charge.value.url,
        expiresAt: charge.value.expiresAt,
      }
    : { status: "FAILED" as const };
  const updated = await context.db.payment.update({ where: { id: row.id }, data });
  context.recordChange({ entityId: row.id, before: row, after: updated });
  if (!charge.ok) return err({ error: charge.error });
  return ok({ value: toPaymentDto({ row: updated }) });
}
