import type { OperationContext } from "../../operations/types";
import { parseKeyMetadata } from "./to-api-key-dto";

export type LoadCreatorNamesInput = {
  context: Pick<OperationContext, "db">;
  rows: readonly { metadata: string | null }[];
};

/** Creator user id → name, for the members of this organization who created the given keys. */
export async function loadCreatorNames({
  context,
  rows,
}: LoadCreatorNamesInput): Promise<Map<string, string>> {
  const userIds = [
    ...new Set(
      rows.flatMap((row) => parseKeyMetadata({ metadata: row.metadata })?.createdBy ?? []),
    ),
  ];
  if (userIds.length === 0) return new Map();
  const members = await context.db.member.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, user: { select: { name: true } } },
  });
  return new Map(members.map((member) => [member.userId, member.user.name]));
}

export type KeyDtoInput = {
  context: Pick<OperationContext, "db">;
  row: { metadata: string | null };
};

/** The creator's name for one key, or `null` when they are no longer a member. */
export async function creatorNameOf({ context, row }: KeyDtoInput): Promise<string | null> {
  const createdBy = parseKeyMetadata({ metadata: row.metadata })?.createdBy ?? "";
  return (await loadCreatorNames({ context, rows: [row] })).get(createdBy) ?? null;
}
