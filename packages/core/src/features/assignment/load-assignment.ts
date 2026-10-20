import type { Assignment } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { type AssignmentDto, type AssignmentSlot, AssignmentSubjectTypeSchema } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** Followers in the order they started following, and the record's base (the subject type). */
export const ASSIGNMENT_INCLUDE = {
  record: { select: { base: true } },
  followers: {
    select: { userId: true },
    orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
  },
};

export type AssignmentRow = Assignment & {
  record: { base: string };
  followers: { userId: string }[];
};

/** The API keeps `subjectType`/`subjectId`; the row references its `Record` (ADR 0056). */
export const toAssignmentDto = ({ row }: { row: AssignmentRow }): AssignmentDto => {
  const { followers, record, recordId, ...assignment } = row;
  return {
    ...assignment,
    subjectType: AssignmentSubjectTypeSchema.parse(record.base),
    subjectId: recordId,
    followerIds: followers.map((follower) => follower.userId),
  };
};

/** The slot's assignment, archived ones included (they are reactivated on write), or null. */
export async function findAssignment({
  context,
  subjectId,
  responsibilityId,
}: Db & AssignmentSlot): Promise<AssignmentDto | null> {
  const row = await context.db.assignment.findFirst({
    where: {
      recordId: subjectId,
      responsibilityId: responsibilityId ?? null,
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    include: ASSIGNMENT_INCLUDE,
  });
  return row ? toAssignmentDto({ row }) : null;
}

/** The main assignee (user id) of a subject, or null when nobody is assigned. */
export async function mainAssigneeId({
  context,
  subjectId,
}: Db & Omit<AssignmentSlot, "responsibilityId">): Promise<string | null> {
  const row = await context.db.assignment.findFirst({
    where: { recordId: subjectId, responsibilityId: null },
    select: { assigneeId: true },
  });
  return row?.assigneeId ?? null;
}
