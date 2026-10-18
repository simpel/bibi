import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { AssignmentSlot, AssignmentSubjectType } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const ENTITY: Record<AssignmentSubjectType, string> = {
  TICKET: "Ticket",
  ITEM: "Item",
};

async function countSubject({ context, subjectType, subjectId }: Db & AssignmentSlot) {
  const where = { where: { id: subjectId } };
  if (subjectType === "TICKET") return context.db.ticket.count(where);
  return context.db.item.count(where);
}

/** The subject must be an active row of the organization (polymorphic, so no FK, ADR 0034). */
export async function checkSubject({
  context,
  subjectType,
  subjectId,
}: Db & AssignmentSlot): Promise<Result<true>> {
  const found = await countSubject({ context, subjectType, subjectId });
  return found > 0 ? ok({ value: true }) : notFound({ entity: ENTITY[subjectType] });
}

/** A responsibility applies only to a ticket and must be an active one of the organization. */
async function checkResponsibility({
  context,
  subjectType,
  responsibilityId,
}: Db & AssignmentSlot) {
  if (!responsibilityId) return ok({ value: true as const });
  const path = "responsibilityId";
  if (subjectType !== "TICKET") {
    const message = "Only a ticket has assignments per responsibility";
    return invalid({ message, issues: [{ path, message }] });
  }
  const found = await context.db.responsibility.count({ where: { id: responsibilityId } });
  if (found > 0) return ok({ value: true as const });
  const message = "Unknown responsibility";
  return invalid({ message, issues: [{ path, message }] });
}

/** The subject belongs to the organization and the responsibility, if any, fits it. */
export async function checkSlot({ context, ...slot }: Db & AssignmentSlot): Promise<Result<true>> {
  const subject = await checkSubject({ context, ...slot });
  if (!subject.ok) return subject;
  return checkResponsibility({ context, ...slot });
}
