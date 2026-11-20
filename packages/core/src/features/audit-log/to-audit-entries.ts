import type { AuditLog } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { memberNames } from "../../shared/member-names";
import type { AuditLogDto } from "./schema";

export type ToAuditEntriesInput = { context: Pick<OperationContext, "db">; rows: AuditLog[] };

/** AuditLog rows → DTOs with the actor's and approver's names (one member lookup). */
export async function toAuditEntries({
  context,
  rows,
}: ToAuditEntriesInput): Promise<AuditLogDto[]> {
  const userIds = rows.flatMap((row) => [row.actorId, row.approvedBy]);
  const names = await memberNames({ context, userIds });
  const nameOf = ({ id }: { id: string | null }) => (id ? (names.get(id) ?? null) : null);
  return rows.map((row) => ({
    ...row,
    actorName: nameOf({ id: row.actorId }),
    approvedByName: nameOf({ id: row.approvedBy }),
  }));
}
