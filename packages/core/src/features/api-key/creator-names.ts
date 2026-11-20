import type { OperationContext } from "../../operations/types";
import { memberNames } from "../../shared/member-names";
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
  const userIds = rows.flatMap(
    (row) => parseKeyMetadata({ metadata: row.metadata })?.createdBy ?? [],
  );
  return memberNames({ context, userIds });
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
