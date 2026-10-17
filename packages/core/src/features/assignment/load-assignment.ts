import type { Assignment } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { AssignmentDto, AssignmentSlot } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** Followers in the order they started following. */
export const WITH_FOLLOWERS = {
  followers: {
    select: { userId: true },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
};

export type AssignmentRow = Assignment & { followers: { userId: string }[] };

export const toAssignmentDto = ({ row }: { row: AssignmentRow }): AssignmentDto => {
  const { followers, ...assignment } = row;
  return { ...assignment, followerIds: followers.map((follower) => follower.userId) };
};

/** The slot's assignment, archived ones included (they are reactivated on write), or null. */
export async function findAssignment({
  context,
  subjectType,
  subjectId,
  responsibilityId,
}: Db & AssignmentSlot): Promise<AssignmentDto | null> {
  const row = await context.db.assignment.findFirst({
    where: {
      subjectType,
      subjectId,
      responsibilityId: responsibilityId ?? null,
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    include: WITH_FOLLOWERS,
  });
  return row ? toAssignmentDto({ row }) : null;
}

/** The main assignee (user id) of a subject, or null when nobody is assigned. */
export async function mainAssigneeId({
  context,
  subjectType,
  subjectId,
}: Db & Omit<AssignmentSlot, "responsibilityId">): Promise<string | null> {
  const row = await context.db.assignment.findFirst({
    where: { subjectType, subjectId, responsibilityId: null },
    select: { assigneeId: true },
  });
  return row?.assigneeId ?? null;
}
