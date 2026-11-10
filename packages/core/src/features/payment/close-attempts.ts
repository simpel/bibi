import type { PaymentAttempt, ProviderConnection } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { authFor } from "../../providers/connections";
import { findProvider } from "../../providers/registry";
import { receivableOpenMinor } from "./receivable-open";

type Context = Pick<OperationContext, "db" | "organizationId">;

export type OpenAttempt = PaymentAttempt & { connection: ProviderConnection | null };

export type CancelAttemptInput = { context: Context; attempt: OpenAttempt };

/**
 * Closes one open attempt at its provider, then marks it CANCELLED (ADR 0058: after a commit).
 * An attempt never started is only marked. A refusal leaves it PENDING and is returned; money
 * that still arrives on it is then an over-payment staff are told about.
 */
export async function cancelAttemptAtProvider({
  context,
  attempt,
}: CancelAttemptInput): Promise<Result<true>> {
  const collect = findProvider({ key: attempt.provider })?.collect;
  if (attempt.providerReference && attempt.connection && collect) {
    const auth = await authFor({ context, row: attempt.connection });
    if (!auth.ok) return auth;
    const done = await collect.cancelAttempt({
      auth: auth.value,
      providerReference: attempt.providerReference,
    });
    if (!done.ok) return done;
  }
  await context.db.paymentAttempt.updateMany({
    where: { id: attempt.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  return ok({ value: true });
}

export type CloseOpenAttemptsInput = { context: Context; paymentId: string };

/**
 * After a payment SUCCEEDED by any route (a provider's signal, staff's record, a ledger
 * provider's booking): its other open attempts are closed at their providers, and so are those
 * of other PENDING payments on the same receivable once nothing is left open on it (ADR 0100),
 * so the customer cannot pay twice. A provider that refuses is logged; never undoes the payment.
 */
export async function closeOpenAttempts({ context, paymentId }: CloseOpenAttemptsInput) {
  const paid = await context.db.payment.findFirst({ where: { id: paymentId } });
  if (!paid) return;
  const ref = { quoteId: paid.quoteId, depositId: paid.depositId, invoiceId: paid.invoiceId };
  const open = await receivableOpenMinor({ context, ref });
  const receivable = paid.quoteId
    ? { quoteId: paid.quoteId }
    : paid.depositId
      ? { depositId: paid.depositId }
      : { invoiceId: paid.invoiceId ?? "" };
  const others =
    open !== null && open <= 0 ? [{ payment: { status: "PENDING" as const, ...receivable } }] : [];
  const attempts = await context.db.paymentAttempt.findMany({
    where: { status: "PENDING", OR: [{ paymentId }, ...others] },
    include: { connection: true },
  });
  for (const attempt of attempts) {
    const closed = await cancelAttemptAtProvider({ context, attempt });
    if (!closed.ok) {
      const fields = { paymentId: attempt.paymentId, attemptId: attempt.id, err: closed.error };
      getLogger().warn({ event: "payment.attemptCancelFailed", ...fields });
    }
  }
}
