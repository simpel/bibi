import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { checkTicket } from "../line/line-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckLevelInput = Db & { ticketId: string; lineId: string | null };

/**
 * Where a requirement applies: an active ticket of the organization, optionally one of that
 * ticket's active lines. A line of another ticket is a `VALIDATION` issue.
 */
export async function checkLevel({
  context,
  ticketId,
  lineId,
}: CheckLevelInput): Promise<Result<boolean>> {
  const ticket = await checkTicket({ context, ticketId });
  if (!ticket.ok || !lineId) return ticket;
  const found = await context.db.line.count({ where: { id: lineId, ticketId } });
  if (found > 0) return ok({ value: true });
  const message = "Not a line of the ticket";
  return invalid({ message, issues: [{ path: "lineId", message }] });
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
  lineId,
  vocabularyValueId,
}: CheckFreeInput): Promise<Result<true>> {
  const taken = await context.db.requirement.count({
    where: { ticketId, lineId, vocabularyValueId },
  });
  if (taken === 0) return ok({ value: true });
  const where = lineId ? "The line" : "The ticket";
  const message = `${where} already has a count for the value; update it instead`;
  return conflict({ message, issues: [{ path: "vocabularyValueId", message }] });
}
