import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type CheckPhaseInput = { context: Pick<OperationContext, "db">; bookingId: string };

/**
 * Sheets go out only from the `CONFIRMED` phase (ADR 0022): a `TENTATIVE` booking holds items
 * but nothing is ordered yet, and after that phase the booking is over or cancelled.
 */
export async function checkPhase({ context, bookingId }: CheckPhaseInput): Promise<Result<true>> {
  const booking = await context.db.booking.findFirst({
    where: { id: bookingId },
    select: { bookingStatus: { select: { phase: true, name: true } } },
  });
  const { phase, name } = booking?.bookingStatus ?? { phase: "CANCELLED", name: "unknown" };
  if (phase === "CONFIRMED") return ok({ value: true });
  const why =
    phase === "TENTATIVE"
      ? "Sheets cannot be sent while the booking is tentative"
      : "Sheets can only be sent while the booking is confirmed";
  return conflict({ message: `${why} (status "${name}")` });
}
