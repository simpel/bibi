import type { OperationContext } from "../../operations/types";
import { parseKeyMetadata } from "./to-api-key-dto";

export type LoadOwnerNamesInput = {
  context: Pick<OperationContext, "db">;
  rows: readonly { metadata: string | null }[];
};

/** Owner user id → name, for the members of this organization who own the given keys. */
export async function loadOwnerNames({
  context,
  rows,
}: LoadOwnerNamesInput): Promise<Map<string, string>> {
  const userIds = [
    ...new Set(rows.flatMap((row) => parseKeyMetadata({ metadata: row.metadata })?.userId ?? [])),
  ];
  if (userIds.length === 0) return new Map();
  const members = await context.db.member.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, user: { select: { name: true } } },
  });
  return new Map(members.map((member) => [member.userId, member.user.name]));
}
