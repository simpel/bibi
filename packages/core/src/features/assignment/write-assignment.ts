import type { OperationContext } from "../../operations/types";
import { effectiveFollowerIds } from "./derive-assignment";
import { loadSlot, loadSlotState, type SlotState, toSlotDto } from "./load-assignment";
import type { AssignmentDto, AssignmentSlot } from "./schema";

type Context = { context: OperationContext };

type RecordInput = Context & { before: AssignmentDto; after: AssignmentDto };

/** Audits the change on the stored choice (nothing is recorded for an unchanged derived slot). */
function recordChoice({ context, before, after }: RecordInput) {
  const entityId = after.id ?? before.id;
  if (entityId) context.recordChange({ entityType: "assignment", entityId, before, after });
}

/** Makes sure the slot has a stored row (creating or reactivating it) and returns it. */
async function ensureChoice({
  context,
  state,
  ...slot
}: Context & AssignmentSlot & { state: SlotState }) {
  if (state.row?.status === "ACTIVE") return state.row.id;
  if (state.row) {
    await context.db.assignment.update({ where: { id: state.row.id }, data: { status: "ACTIVE" } });
    return state.row.id;
  }
  const created = await context.db.assignment.create({
    data: {
      organizationId: context.organizationId,
      recordId: slot.subjectId,
      responsibilityId: slot.responsibilityId ?? null,
      assigneeId: null,
    },
  });
  return created.id;
}

export type SaveAssigneeInput = Context & AssignmentSlot & { assigneeId: string | null };

/**
 * Records who the member chose to answer for the slot (ADR 0055), creating or reactivating its
 * row. null removes the choice: a responsibility then falls back to its default. The caller has
 * checked the slot and that the assignee is a member.
 */
export async function saveAssignee({
  context,
  assigneeId,
  ...slot
}: SaveAssigneeInput): Promise<AssignmentDto> {
  const state = await loadSlotState({ context, ...slot });
  const before = toSlotDto({ context, ...slot, ...state });
  if (!state.row && assigneeId === null) return before;
  const id = await ensureChoice({ context, state, ...slot });
  await context.db.assignment.update({ where: { id }, data: { assigneeId } });
  const after = await loadSlot({ context, ...slot });
  recordChoice({ context, before, after });
  return after;
}

export type ChangeFollowerInput = Context & AssignmentSlot & { userId: string };

/** Follows the slot (idempotent): joins the explicit follows, or undoes an unfollow of a default. */
export async function addFollower({ context, userId, ...slot }: ChangeFollowerInput) {
  const state = await loadSlotState({ context, ...slot });
  const before = toSlotDto({ context, ...slot, ...state });
  if (effectiveFollowerIds({ assignment: before }).includes(userId)) return before;
  const existing = state.row?.followers.find((follower) => follower.userId === userId);
  const isDefault = state.defaults?.followerIds.includes(userId) ?? false;
  const assignmentId = await ensureChoice({ context, state, ...slot });
  if (isDefault) {
    await context.db.assignmentFollower.deleteMany({ where: { assignmentId, userId } });
  } else if (existing) {
    await context.db.assignmentFollower.updateMany({
      where: { assignmentId, userId },
      data: { effect: "FOLLOW" },
    });
  } else {
    await context.db.assignmentFollower.create({
      data: { organizationId: context.organizationId, assignmentId, userId },
    });
  }
  const after = await loadSlot({ context, ...slot });
  recordChoice({ context, before, after });
  return after;
}

/**
 * Leaves the slot (idempotent): a default follower gets an explicit unfollow, anyone else just
 * loses their explicit follow. Null when nothing is stored and no responsibility gives defaults.
 */
export async function removeFollower({ context, userId, ...slot }: ChangeFollowerInput) {
  const state = await loadSlotState({ context, ...slot });
  if (!state.row && !state.defaults) return null;
  const before = toSlotDto({ context, ...slot, ...state });
  if (!effectiveFollowerIds({ assignment: before }).includes(userId)) return before;
  const assignmentId = await ensureChoice({ context, state, ...slot });
  const isDefault = state.defaults?.followerIds.includes(userId) ?? false;
  await context.db.assignmentFollower.deleteMany({ where: { assignmentId, userId } });
  if (isDefault) {
    await context.db.assignmentFollower.create({
      data: { organizationId: context.organizationId, assignmentId, userId, effect: "UNFOLLOW" },
    });
  }
  const after = await loadSlot({ context, ...slot });
  recordChoice({ context, before, after });
  return after;
}
