import type { OperationContext } from "../../operations/types";
import type { AssignmentSubjectType } from "./schema";

export type SubjectFilterInput = {
  context: Pick<OperationContext, "db">;
  subjectType: AssignmentSubjectType;
  /** Only subjects this member answers for (main or per responsibility). */
  assigneeId?: string | undefined;
  /** Only subjects this member follows. */
  followerId?: string | undefined;
};

/**
 * The `id` filter for a list of subjects by assignment (e.g. `booking.list({ assigneeId })`), or
 * `{}` when neither filter is given.
 */
export async function subjectIdFilter({
  context,
  subjectType,
  assigneeId,
  followerId,
}: SubjectFilterInput): Promise<{ id?: { in: string[] } }> {
  if (!assigneeId && !followerId) return {};
  const rows = await context.db.assignment.findMany({
    where: {
      subjectType,
      ...(assigneeId ? { assigneeId } : {}),
      ...(followerId ? { followers: { some: { userId: followerId } } } : {}),
    },
    select: { subjectId: true },
  });
  return { id: { in: [...new Set(rows.map((row) => row.subjectId))] } };
}
