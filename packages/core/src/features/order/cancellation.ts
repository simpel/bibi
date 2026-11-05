import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { releaseLinesOfOrder } from "../line/release-for-order";
import type { OrderDto } from "./schema";

export type CancellationInput = {
  context: OperationContext;
  /** The order as it was before the cancellation. */
  order: OrderDto;
  reason: string | null;
};

/**
 * Applies the organization's cancellation terms to an order that enters a closing status (ADR
 * 0022, 0043). Cancellation
 * terms are not built yet (domain model: CancellationTerms); when they are, their hook goes in
 * `CANCELLATION_HOOKS` and runs inside the same transaction as the status change. An error rolls
 * the whole change back.
 */
export type CancellationHook = (input: CancellationInput) => Promise<Result<true>>;

export const CANCELLATION_HOOKS: CancellationHook[] = [];

/**
 * Everything entering a closing status does beyond the status change: every line moves to its
 * released state. The holds go by trigger (ADR 0053).
 */
export async function applyClosing({
  context,
  order,
  reason,
}: CancellationInput): Promise<Result<true>> {
  const program = await releaseLinesOfOrder({ context, orderId: order.id });
  if (!program.ok) return program;
  for (const hook of CANCELLATION_HOOKS) {
    const result = await hook({ context, order, reason });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
