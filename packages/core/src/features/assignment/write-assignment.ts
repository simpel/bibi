import type { OperationContext } from "../../operations/types";
import { ASSIGNMENT_INCLUDE, findAssignment, toAssignmentDto } from "./load-assignment";
import type { AssignmentDto, AssignmentSlot } from "./schema";

type Context = { context: OperationContext };

export type SaveAssigneeInput = Context & AssignmentSlot & { assigneeId: string | null };

/**
 * Sets who answers for the slot, creating (or reactivating) its assignment, and records the
 * change. The caller has checked the slot and that the assignee is a member.
 */
export async function saveAssignee({
  context,
  assigneeId,
  ...slot
}: SaveAssigneeInput): Promise<AssignmentDto> {
  const before = await findAssignment({ context, ...slot });
  const row = before
    ? await context.db.assignment.update({
        where: { id: before.id },
        data: { assigneeId, status: "ACTIVE" },
        include: ASSIGNMENT_INCLUDE,
      })
    : await context.db.assignment.create({
        data: {
          organizationId: context.organizationId,
          recordId: slot.subjectId,
          responsibilityId: slot.responsibilityId ?? null,
          assigneeId,
        },
        include: ASSIGNMENT_INCLUDE,
      });
  const after = toAssignmentDto({ row });
  context.recordChange({ entityType: "assignment", entityId: after.id, before, after });
  return after;
}

export type ChangeFollowerInput = Context & AssignmentSlot & { userId: string };

/** Adds a follower (idempotent), creating the assignment without an assignee if needed. */
export async function addFollower({ context, userId, ...slot }: ChangeFollowerInput) {
  const before = await findAssignment({ context, ...slot });
  const assignment =
    before?.status === "ACTIVE"
      ? before
      : await saveAssignee({ context, ...slot, assigneeId: before?.assigneeId ?? null });
  if (assignment.followerIds.includes(userId)) return assignment;
  await context.db.assignmentFollower.create({
    data: { organizationId: context.organizationId, assignmentId: assignment.id, userId },
  });
  return recordFollowers({ context, before: assignment });
}

/** Removes a follower (idempotent). */
export async function removeFollower({ context, userId, ...slot }: ChangeFollowerInput) {
  const before = await findAssignment({ context, ...slot });
  if (!before?.followerIds.includes(userId)) return before;
  await context.db.assignmentFollower.deleteMany({ where: { assignmentId: before.id, userId } });
  return recordFollowers({ context, before });
}

async function recordFollowers({ context, before }: Context & { before: AssignmentDto }) {
  const row = await context.db.assignment.findFirstOrThrow({
    where: { id: before.id },
    include: ASSIGNMENT_INCLUDE,
  });
  const after = toAssignmentDto({ row });
  context.recordChange({ entityType: "assignment", entityId: after.id, before, after });
  return after;
}
