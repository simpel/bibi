import type { OperationContext } from "../../operations/types";
import { derivedSlots } from "./derived-membership";
import type { AssignmentKind, AssignmentSubjectType } from "./schema";

export type SubjectFilterInput = {
  context: Pick<OperationContext, "db">;
  subjectType: AssignmentSubjectType;
  /** Only subjects this member answers for (main or per responsibility, stored or default). */
  assigneeId?: string | undefined;
  /** Only subjects this member follows (stored or default). */
  followerId?: string | undefined;
};

type OneInput = Pick<SubjectFilterInput, "context" | "subjectType"> & {
  userId: string;
  kind: AssignmentKind;
};

/** The subjects the member has a stored choice on, or gets from a responsibility's defaults. */
async function subjectIdsOf({ context, subjectType, userId, kind }: OneInput) {
  const mine =
    kind === "ASSIGNED"
      ? { assigneeId: userId }
      : { followers: { some: { userId, effect: "FOLLOW" as const } } };
  const rows = await context.db.assignment.findMany({
    where: { record: { base: subjectType }, ...mine },
    select: { recordId: true },
  });
  const ids = rows.map((row) => row.recordId);
  if (subjectType !== "TICKET") return new Set(ids);
  const derived = await derivedSlots({ context, userId, kind });
  return new Set([...ids, ...derived.map((slot) => slot.ticketId)]);
}

/**
 * The `id` filter for a list of subjects by assignment (e.g. `ticket.list({ assigneeId })`), or
 * `{}` when neither filter is given. Both filters together keep the subjects that match both.
 */
export async function subjectIdFilter({
  context,
  subjectType,
  assigneeId,
  followerId,
}: SubjectFilterInput): Promise<{ id?: { in: string[] } }> {
  if (!assigneeId && !followerId) return {};
  const sets: Set<string>[] = [];
  if (assigneeId) {
    sets.push(await subjectIdsOf({ context, subjectType, userId: assigneeId, kind: "ASSIGNED" }));
  }
  if (followerId) {
    sets.push(await subjectIdsOf({ context, subjectType, userId: followerId, kind: "FOLLOWING" }));
  }
  const [first = new Set<string>(), ...rest] = sets;
  return { id: { in: [...first].filter((id) => rest.every((set) => set.has(id))) } };
}
