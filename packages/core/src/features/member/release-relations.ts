import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { inUseConflict } from "../../shared/in-use";
import { ASSIGNMENT_INCLUDE, loadDefaults, toSlotDto } from "../assignment/load-assignment";
import { AssignmentSubjectTypeSchema } from "../assignment/schema";
import { BOARD_ORDER, toBoardDto, WITH_PHASES } from "../board/load-board";

type UserInput = { context: OperationContext; userId: string };

/**
 * A member who is a responsibility's default assignee or default follower cannot be removed: the
 * default is never copied onto orders (ADR 0055), so an admin reassigns it first.
 */
export async function checkNoDefaults({ context, userId }: UserInput): Promise<Result<true>> {
  const rows = await context.db.responsibility.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ defaultAssigneeId: userId }, { defaultFollowers: { some: { userId } } }],
    },
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  if (rows.length === 0) return ok({ value: true });
  const names = rows.map(({ name }) => name).join(", ");
  return inUseConflict({
    context,
    feature: "responsibility",
    message: `Reassign the default assignee and followers of these responsibilities first: ${names}`,
    issues: rows.map(({ id, name }) => ({ path: `responsibilities.${id}`, message: name })),
  });
}

/**
 * Drops the member's explicit assignments and follows (ADR 0055): the slot falls back to its
 * responsibility's default; a row left with no choice at all is archived. Audited per slot.
 */
export async function releaseAssignments({ context, userId }: UserInput): Promise<void> {
  const rows = await context.db.assignment.findMany({
    where: { status: "ACTIVE", OR: [{ assigneeId: userId }, { followers: { some: { userId } } }] },
    include: ASSIGNMENT_INCLUDE,
  });
  const responsibilityIds = rows.flatMap(({ responsibilityId: id }) => (id ? [id] : []));
  const defaults = await loadDefaults({ context, responsibilityIds });
  for (const row of rows) {
    const slot = {
      subjectType: AssignmentSubjectTypeSchema.parse(row.record.base),
      subjectId: row.recordId,
      responsibilityId: row.responsibilityId,
    };
    const slotDefaults = row.responsibilityId ? (defaults.get(row.responsibilityId) ?? null) : null;
    const before = toSlotDto({ context, ...slot, row, defaults: slotDefaults });
    await context.db.assignmentFollower.deleteMany({ where: { assignmentId: row.id, userId } });
    const followers = row.followers.filter((follower) => follower.userId !== userId);
    const assigneeId = row.assigneeId === userId ? null : row.assigneeId;
    const status = assigneeId === null && followers.length === 0 ? "ARCHIVED" : "ACTIVE";
    const updated = await context.db.assignment.update({
      where: { id: row.id },
      data: { assigneeId, status },
    });
    const next = { ...updated, record: row.record, followers };
    const after = toSlotDto({ context, ...slot, row: next, defaults: slotDefaults });
    context.recordChange({ entityType: "assignment", entityId: row.id, before, after });
  }
}

/**
 * Ends the member's view sharing (ADR 0111): shares with them are deleted; a view they own is
 * archived when nobody else sees it, else handed to the member who removes them (no owner when
 * an API key or SYSTEM removes them, or they remove themselves). Audited per view.
 */
export async function releaseBoards({ context, userId }: UserInput): Promise<void> {
  const rows = await context.db.board.findMany({
    where: { status: "ACTIVE", OR: [{ ownerId: userId }, { shares: { some: { userId } } }] },
    include: WITH_PHASES,
    orderBy: BOARD_ORDER,
  });
  await context.db.boardShare.deleteMany({ where: { userId } });
  const remover = context.actor.userId;
  const heir = remover && remover !== userId ? remover : null;
  for (const row of rows) {
    const shares = row.shares.filter((share) => share.userId !== userId);
    const owned = row.ownerId === userId;
    const seen = row.sharedWithOrganization || shares.length > 0;
    const data = !owned ? {} : seen ? { ownerId: heir } : { status: "ARCHIVED" as const };
    const updated = await context.db.board.update({ where: { id: row.id }, data });
    const before = toBoardDto({ context, row });
    const after = toBoardDto({ context, row: { ...updated, phases: row.phases, shares } });
    context.recordChange({ entityType: "board", entityId: row.id, before, after });
  }
}
