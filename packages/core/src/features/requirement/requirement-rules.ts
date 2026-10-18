import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { checkTicket } from "../program-item/program-item-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckLevelInput = Db & { ticketId: string; programItemId: string | null };

/**
 * Where a requirement applies: an active ticket of the organization, optionally one of that
 * ticket's active program items. A program item of another ticket is a `VALIDATION` issue.
 */
export async function checkLevel({
  context,
  ticketId,
  programItemId,
}: CheckLevelInput): Promise<Result<boolean>> {
  const ticket = await checkTicket({ context, ticketId });
  if (!ticket.ok || !programItemId) return ticket;
  const found = await context.db.programItem.count({ where: { id: programItemId, ticketId } });
  if (found > 0) return ok({ value: true });
  const message = "Not a program item of the ticket";
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
  ticketId,
  programItemId,
  vocabularyValueId,
}: CheckFreeInput): Promise<Result<true>> {
  const taken = await context.db.requirement.count({
    where: { ticketId, programItemId, vocabularyValueId },
  });
  if (taken === 0) return ok({ value: true });
  const where = programItemId ? "The program item" : "The ticket";
  const message = `${where} already has a count for the value; update it instead`;
  return conflict({ message, issues: [{ path: "vocabularyValueId", message }] });
}
