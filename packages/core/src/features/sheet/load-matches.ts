import type { OperationContext } from "../../operations/types";
import { resolveItemTags } from "../item/resolve-item";
import { effectiveRequirements } from "../requirement/effective";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { type MatchedProgramItem, matchRequirements } from "./match-requirements";
import type { SheetMatch } from "./schema";

export type LoadMatchesInput = {
  context: Pick<OperationContext, "db">;
  bookingId: string;
  definition: Pick<SheetDefinitionDto, "entityTypeIds" | "vocabularyIds">;
};

/** The booking's program items whose item is of an included type, each with its resolved tags. */
async function loadProgramItems({
  context,
  bookingId,
  definition,
}: LoadMatchesInput): Promise<MatchedProgramItem[]> {
  const rows = await context.db.programItem.findMany({
    where: { bookingId, item: { entityTypeId: { in: definition.entityTypeIds } } },
    select: { id: true, name: true, itemId: true },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
  });
  const found: MatchedProgramItem[] = [];
  const resolved = new Map<string, MatchedProgramItem["resolution"] | null>();
  for (const { id, name, itemId } of rows) {
    if (!itemId) continue;
    if (!resolved.has(itemId)) resolved.set(itemId, await resolveItemTags({ context, id: itemId }));
    const resolution = resolved.get(itemId);
    if (resolution) found.push({ id, name, resolution });
  }
  return found;
}

/** The counts of the included lists that hit the booking's included items (`SheetMatch`). */
export async function loadMatches({
  context,
  bookingId,
  definition,
}: LoadMatchesInput): Promise<SheetMatch[]> {
  const [programItems, effective] = await Promise.all([
    loadProgramItems({ context, bookingId, definition }),
    effectiveRequirements({ context, bookingId }),
  ]);
  const { vocabularyIds } = definition;
  return matchRequirements({ programItems, effective, vocabularyIds });
}
