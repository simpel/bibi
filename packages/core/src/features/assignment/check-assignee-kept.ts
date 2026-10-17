import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { ASSIGNEE_REQUIRED_PHASES } from "../booking/phase-rules";
import { ASSIGNEE_REQUIRED_STATUSES } from "../inquiry/transitions";
import type { AssignmentSlot } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

async function bookingNeedsAssignee({ context, subjectId }: Db & { subjectId: string }) {
  const booking = await context.db.booking.findFirst({
    where: { id: subjectId },
    select: { bookingStatus: { select: { phase: true, name: true } } },
  });
  const status = booking?.bookingStatus;
  return status && ASSIGNEE_REQUIRED_PHASES.includes(status.phase) ? status.name : null;
}

async function inquiryNeedsAssignee({ context, subjectId }: Db & { subjectId: string }) {
  const inquiry = await context.db.inquiry.findFirst({
    where: { id: subjectId },
    select: { inquiryStatus: true },
  });
  const status = inquiry?.inquiryStatus;
  return status && ASSIGNEE_REQUIRED_STATUSES.includes(status) ? status : null;
}

/**
 * The main assignee cannot be removed while the subject's phase requires one (ADR 0034): a
 * booking from `CONFIRMED`, an inquiry from `QUALIFIED`. Responsibility assignments are never
 * required.
 */
export async function checkAssigneeKept({
  context,
  subjectType,
  subjectId,
  responsibilityId,
}: Db & AssignmentSlot): Promise<Result<true>> {
  if (responsibilityId) return ok({ value: true });
  const needs =
    subjectType === "BOOKING"
      ? await bookingNeedsAssignee({ context, subjectId })
      : subjectType === "INQUIRY"
        ? await inquiryNeedsAssignee({ context, subjectId })
        : null;
  if (!needs) return ok({ value: true });
  return conflict({ message: `A ${subjectType.toLowerCase()} in "${needs}" requires an assignee` });
}
