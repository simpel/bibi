import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { ReceivableStatus } from "./settlement-schema";

/**
 * The lifecycle of a deposit request or an invoice (ADR 0057): `DRAFT → SENT → VOID`, and a DRAFT
 * may be voided too. VOID is final. Payment progress is not a status: it is derived.
 */
export const RECEIVABLE_TRANSITIONS: Readonly<
  Record<ReceivableStatus, readonly ReceivableStatus[]>
> = { DRAFT: ["SENT", "VOID"], SENT: ["VOID"], VOID: [] };

export type ReceivableMove = { what: string; from: ReceivableStatus; to: ReceivableStatus };

/** `CONFLICT` unless the lifecycle allows the move. */
export function checkReceivableMove({ what, from, to }: ReceivableMove): Result<true> {
  if (RECEIVABLE_TRANSITIONS[from].includes(to)) return ok({ value: true });
  return conflict({ message: `A ${from} ${what} cannot become ${to}` });
}

export type CheckVoidableInput = {
  context: Pick<OperationContext, "db">;
  where: { depositId: string } | { invoiceId: string };
  paidMinor: number;
};

/** Voiding would hide money: refused while a payment is PENDING or anything is still paid. */
export async function checkVoidable({
  context,
  where,
  paidMinor,
}: CheckVoidableInput): Promise<Result<true>> {
  const pending = await context.db.payment.count({ where: { ...where, status: "PENDING" } });
  if (pending > 0) return conflict({ message: "It has a pending payment; wait for it to settle" });
  if (paidMinor !== 0) return conflict({ message: "It has been paid; refund the payment first" });
  return ok({ value: true });
}
