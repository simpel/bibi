import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { loadChargeableTicket } from "./payment-preconditions";
import { checkReceivableMove, checkVoidable } from "./receivable-lifecycle";
import type { ReceivableStatus } from "./settlement-schema";

type Moveable = { id: string; ticketId: string; status: ReceivableStatus; paidMinor: number };

export type MoveReceivableInput<T extends Moveable> = {
  context: Pick<OperationContext, "db" | "recordChange">;
  kind: "deposit" | "invoice";
  id: string;
  to: ReceivableStatus;
  load: () => Promise<T | null>;
  /** Moves the row from `from` to `to`; the number of rows changed (0 = it moved meanwhile). */
  claim: (move: { from: ReceivableStatus; to: ReceivableStatus }) => Promise<number>;
};

/**
 * The one place a deposit's or an invoice's status changes (ADR 0057). The claim locks the row
 * first, so a concurrent `payment.create` either waits and is then seen by the void check, or
 * sees the VOID itself. Sending needs a chargeable ticket.
 */
export async function moveReceivable<T extends Moveable>({
  context,
  kind,
  id,
  to,
  load,
  claim,
}: MoveReceivableInput<T>): Promise<Result<T>> {
  const entity = kind === "deposit" ? "Deposit" : "Invoice";
  const before = await load();
  if (!before) return notFound({ entity });
  const allowed = checkReceivableMove({ what: kind, from: before.status, to });
  if (!allowed.ok) return allowed;
  if (to === "SENT") {
    const ticket = await loadChargeableTicket({ context, ticketId: before.ticketId });
    if (!ticket.ok) return ticket;
  }
  if ((await claim({ from: before.status, to })) === 0) {
    return conflict({ message: `The ${kind} was changed meanwhile` });
  }
  const after = await load();
  if (!after) return notFound({ entity });
  if (to === "VOID") {
    const where = kind === "deposit" ? { depositId: id } : { invoiceId: id };
    const voidable = await checkVoidable({ context, where, paidMinor: after.paidMinor });
    if (!voidable.ok) return voidable;
  }
  context.recordChange({ entityType: kind, entityId: id, before, after });
  return ok({ value: after });
}
