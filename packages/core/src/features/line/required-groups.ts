import type { OperationContext } from "../../operations/types";
import type { LineRecord } from "./schema";
import type { LineWarning } from "./warning-schema";

export type OpenRequiredGroupsInput = {
  context: Pick<OperationContext, "db">;
  lines: readonly LineRecord[];
};

/**
 * `UNCHOSEN_REQUIRED_GROUP` (ADR 0089) for each active top-level line whose item has a group
 * with minPick 1 or more and no option line of that group, by line id, in group order. Two
 * queries for any number of lines; nothing is stored.
 */
export async function loadOpenRequiredGroups({ context, lines }: OpenRequiredGroupsInput) {
  const out = new Map<string, LineWarning[]>();
  const open = lines.filter(
    (line) => line.status === "ACTIVE" && line.role === null && line.itemId !== null,
  );
  const itemIds = [...new Set(open.map((line) => line.itemId as string))];
  if (itemIds.length === 0) return out;
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: { in: itemIds }, minPick: { gte: 1 } },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true, itemId: true, options: { select: { itemId: true } } },
  });
  if (groups.length === 0) return out;
  const chosen = await context.db.line.findMany({
    where: {
      parentLineId: { in: open.map((line) => line.id) },
      role: "OPTION",
      status: "ACTIVE",
    },
    select: { parentLineId: true, itemId: true },
  });
  for (const line of open) {
    const picked = new Set(
      chosen.filter((option) => option.parentLineId === line.id).map((option) => option.itemId),
    );
    const warnings = groups
      .filter((group) => group.itemId === line.itemId)
      .filter((group) => !group.options.some((option) => picked.has(option.itemId)))
      .map((group): LineWarning => ({ id: group.id, kind: "UNCHOSEN_REQUIRED_GROUP" }));
    if (warnings.length > 0) out.set(line.id, warnings);
  }
  return out;
}
