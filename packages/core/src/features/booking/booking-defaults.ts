import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { BookingPhase } from "../booking-status/schema";

type Db = { context: Pick<OperationContext, "db"> };

export type FirstStatusOfPhaseInput = Db & { phase: BookingPhase };

/** The first active status of a phase (ADR 0022), by position. */
export async function firstStatusIdOfPhase({
  context,
  phase,
}: FirstStatusOfPhaseInput): Promise<Result<string>> {
  const status = await context.db.bookingStatus.findFirst({
    where: { phase },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (status) return ok({ value: status.id });
  return conflict({ message: `The organization has no booking status in phase ${phase}` });
}

/**
 * The status a new booking gets: the first active status of the `TENTATIVE` phase (ADR 0022).
 * Every organization is provisioned with one, and the last one of a phase cannot be archived.
 */
export const defaultTentativeStatusId = ({ context }: Db): Promise<Result<string>> =>
  firstStatusIdOfPhase({ context, phase: "TENTATIVE" });

/**
 * The next reference number of the organization (highest + 1, archived bookings included). Two
 * concurrent creates can pick the same number; the unique index then refuses one (`CONFLICT`).
 */
export async function nextReference({ context }: Db): Promise<number> {
  const top = await context.db.booking.aggregate({
    where: { status: { in: ["ACTIVE", "ARCHIVED"] } },
    _max: { reference: true },
  });
  return (top._max.reference ?? 0) + 1;
}
