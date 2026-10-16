import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { checkBooking } from "../program-item/program-item-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckLevelInput = Db & { bookingId: string; programItemId: string | null };

/**
 * Where a requirement applies: an active booking of the organization, optionally one of that
 * booking's active program items. A program item of another booking is a `VALIDATION` issue.
 */
export async function checkLevel({
  context,
  bookingId,
  programItemId,
}: CheckLevelInput): Promise<Result<boolean>> {
  const booking = await checkBooking({ context, bookingId });
  if (!booking.ok || !programItemId) return booking;
  const found = await context.db.programItem.count({ where: { id: programItemId, bookingId } });
  if (found > 0) return ok({ value: true });
  const message = "Not a program item of the booking";
  return invalid({ message, issues: [{ path: "programItemId", message }] });
}

export type CheckValueInput = Db & { vocabularyValueId: string };

/**
 * The counted value is an active value of an active list in the organization. The org-scoped
 * client hides other organizations' and archived values.
 */
export async function checkValue({
  context,
  vocabularyValueId,
}: CheckValueInput): Promise<Result<true>> {
  const found = await context.db.vocabularyValue.count({
    where: { id: vocabularyValueId, vocabulary: { status: "ACTIVE" } },
  });
  if (found > 0) return ok({ value: true });
  const message = "Unknown list value";
  return invalid({ message, issues: [{ path: "vocabularyValueId", message }] });
}

export type CheckFreeInput = CheckLevelInput & { vocabularyValueId: string };

/** One active count per list value and level; a second one is a `CONFLICT` (update it instead). */
export async function checkFree({
  context,
  bookingId,
  programItemId,
  vocabularyValueId,
}: CheckFreeInput): Promise<Result<true>> {
  const taken = await context.db.requirement.count({
    where: { bookingId, programItemId, vocabularyValueId },
  });
  if (taken === 0) return ok({ value: true });
  const where = programItemId ? "The program item" : "The booking";
  const message = `${where} already has a count for the value; update it instead`;
  return conflict({ message, issues: [{ path: "vocabularyValueId", message }] });
}
