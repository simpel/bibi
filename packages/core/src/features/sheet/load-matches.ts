import type { OperationContext } from "../../operations/types";
import { resolveItemTags } from "../item/resolve-item";
import { effectiveRequirements } from "../requirement/effective";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { type MatchedLine, matchRequirements } from "./match-requirements";
import type { SheetMatch } from "./schema";
import { sheetLinesWhere } from "./sheet-lines";

export type LoadMatchesInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  definition: Pick<SheetDefinitionDto, "entityTypeIds" | "vocabularyIds">;
};

/** The ticket's lines whose item is of an included type, each with its resolved tags. */
async function loadLines({
  context,
  ticketId,
  definition,
}: LoadMatchesInput): Promise<MatchedLine[]> {
  const rows = await context.db.line.findMany({
    where: sheetLinesWhere({ ticketId, entityTypeIds: definition.entityTypeIds }),
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

/** The counts of the included lists that hit the ticket's included items (`SheetMatch`). */
export async function loadMatches({
  context,
  ticketId,
  definition,
}: LoadMatchesInput): Promise<SheetMatch[]> {
  const [lines, effective] = await Promise.all([
    loadLines({ context, ticketId, definition }),
    effectiveRequirements({ context, ticketId }),
  ]);
  const { vocabularyIds } = definition;
  return matchRequirements({ lines, effective, vocabularyIds });
}
