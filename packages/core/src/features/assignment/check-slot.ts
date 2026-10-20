import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { AssignmentSlot, AssignmentSubjectType } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const ENTITY: Record<AssignmentSubjectType, string> = {
  TICKET: "Ticket",
  ITEM: "Item",
};

/**
 * The subject must be a record of the organization (ADR 0056) whose base is the subject type.
 * The composite foreign key on `Assignment.recordId` keeps it in the organization; this check
 * only turns a missing or mistyped id into `NOT_FOUND` before the write.
 */
export async function checkSubject({
  context,
  subjectType,
  subjectId,
}: Db & AssignmentSlot): Promise<Result<true>> {
  const found = await context.db.record.count({ where: { id: subjectId, base: subjectType } });
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
