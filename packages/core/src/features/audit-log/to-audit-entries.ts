import type { AuditLog } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { AuditLogDto } from "./schema";

export type ToAuditEntriesInput = { context: Pick<OperationContext, "db">; rows: AuditLog[] };

/** Display names of the org members among `userIds`; others (left, system) are absent. */
async function memberNames({
  context,
  userIds,
}: {
  context: Pick<OperationContext, "db">;
  userIds: string[];
}): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const members = await context.db.member.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, user: { select: { name: true } } },
  });
  return new Map(members.map((member) => [member.userId, member.user.name]));
}

/** AuditLog rows → DTOs with the actor's and approver's names (one member lookup). */
export async function toAuditEntries({
  context,
  rows,
}: ToAuditEntriesInput): Promise<AuditLogDto[]> {
  const ids = rows.flatMap((row) => [row.actorId, row.approvedBy]);
  const userIds = [...new Set(ids.filter((id): id is string => id !== null))];
  const names = await memberNames({ context, userIds });
  const nameOf = ({ id }: { id: string | null }) => (id ? (names.get(id) ?? null) : null);
  return rows.map((row) => ({
    ...row,
    actorName: nameOf({ id: row.actorId }),
    approvedByName: nameOf({ id: row.approvedBy }),
  }));
}
