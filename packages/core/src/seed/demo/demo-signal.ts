import { ok, type Result } from "../../errors/result";
import { applyPaymentSignal } from "../../features/payment/apply-signal-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { SignalKind } from "../../providers/signal";
import { nowOf } from "../../time/now";
import { missing } from "./seed-fields";

export type DemoSignalInput = {
  context: ExecuteContext;
  paymentId: string;
  kind: SignalKind;
  /** The refund Bibi started that a `refund.*` signal completes. */
  refundId?: string;
};

/** The provider's signal for a demo payment, applied as its webhook would (ADR 0100). */
export async function applyDemoSignal({
  context,
  paymentId,
  kind,
  refundId,
}: DemoSignalInput): Promise<Result<true>> {
  const row = await context.db.payment.findFirst({
    where: { id: paymentId },
    include: { connection: true, attempts: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!row?.provider || !row.connection)
    return missing({ what: `connection of payment ${paymentId}` });
  const reference = row.attempts[0]?.providerReference;
  const input = {
    provider: row.provider,
    eventId: `demo-${paymentId}-${kind}-${refundId ?? 0}`,
    kind,
    externalAccountId: row.connection.externalAccountId,
    paymentId,
    ...(reference ? { reference } : {}),
    ...(refundId ? { refundId } : {}),
    occurredAt: nowOf({ context }),
  };
  const applied = await execute({ operation: applyPaymentSignal, input, context });
  return applied.ok ? ok({ value: true }) : applied;
}
