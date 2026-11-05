import type { OperationContext } from "../../operations/types";
import { resolveItemTags } from "../item/resolve-item";
import { effectiveRequirements } from "../requirement/effective";
import type { RunSheetDefinitionDto } from "../run-sheet-definition/schema";
import { type MatchedLine, matchRequirements } from "./match-requirements";
import { runSheetLinesWhere } from "./run-sheet-lines";
import type { RunSheetMatch } from "./schema";

export type LoadMatchesInput = {
  context: Pick<OperationContext, "db">;
  orderId: string;
  definition: Pick<RunSheetDefinitionDto, "entityTypeIds" | "vocabularyIds">;
};

/** The order's lines whose item is of an included type, each with its resolved tags. */
async function loadLines({
  context,
  orderId,
  definition,
}: LoadMatchesInput): Promise<MatchedLine[]> {
  const rows = await context.db.line.findMany({
    where: runSheetLinesWhere({ orderId, entityTypeIds: definition.entityTypeIds }),
    select: { id: true, name: true, itemId: true },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  const found: MatchedLine[] = [];
  const resolved = new Map<string, MatchedLine["resolution"] | null>();
  for (const { id, name, itemId } of rows) {
    if (!itemId) continue;
    if (!resolved.has(itemId)) resolved.set(itemId, await resolveItemTags({ context, id: itemId }));
    const resolution = resolved.get(itemId);
    if (resolution) found.push({ id, name, resolution });
  }
  return found;
}

/** The counts of the included lists that hit the order's included items (`RunSheetMatch`). */
export async function loadMatches({
  context,
  orderId,
  definition,
}: LoadMatchesInput): Promise<RunSheetMatch[]> {
  const [lines, effective] = await Promise.all([
    loadLines({ context, orderId, definition }),
    effectiveRequirements({ context, orderId }),
  ]);
  const { vocabularyIds } = definition;
  return matchRequirements({ lines, effective, vocabularyIds });
}
