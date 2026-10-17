import { getLogger } from "@okazi/logger";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { changeBookingStatus } from "../booking/change-status-operation";

export type ConfirmBookingInput = { context: ExecuteContext; bookingId: string };

export type ConfirmOutcome = "confirmed" | "skipped" | "failed";

/**
 * Moves a booking that is still tentative to its organization's default `CONFIRMED` status once it
 * has been paid (ADR 0028), as SYSTEM through `booking.changeStatus`, so the organization's own
 * transitions and the phase rules (a main assignee is required) still apply. A refusal never undoes
 * the payment: it is logged and staff confirm the booking by hand.
 */
export async function confirmBookingAfterPayment({
  context,
  bookingId,
}: ConfirmBookingInput): Promise<ConfirmOutcome> {
  const booking = await context.db.booking.findFirst({
    where: { id: bookingId },
    select: { bookingStatus: { select: { phase: true } } },
  });
  if (booking?.bookingStatus.phase !== "TENTATIVE") return "skipped";
  const target = await context.db.bookingStatus.findFirst({
    where: { phase: "CONFIRMED", status: "ACTIVE" },
    orderBy: { position: "asc" },
  });
  const logFields = { event: "payment.webhook.confirm_failed", bookingId };
  if (!target) {
    getLogger().warn({ ...logFields, reason: "no active CONFIRMED status" });
    return "failed";
  }
  const result = await execute({
    operation: changeBookingStatus,
    input: { bookingId, statusId: target.id },
    context,
  });
  if (result.ok) return "confirmed";
  getLogger().warn({ ...logFields, reason: result.error.code });
  return "failed";
}
