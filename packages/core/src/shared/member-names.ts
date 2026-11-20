import type { OperationContext } from "../operations/types";

export type MemberNamesInput = {
  context: Pick<OperationContext, "db">;
  userIds: readonly (string | null)[];
};

/** Display names of the organization's members among `userIds`; others (left, system) are absent. */
export async function memberNames({
  context,
  userIds,
}: MemberNamesInput): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => id !== null))];
  if (ids.length === 0) return new Map();
  const members = await context.db.member.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, user: { select: { name: true } } },
  });
  return new Map(members.map((member) => [member.userId, member.user.name]));
}
