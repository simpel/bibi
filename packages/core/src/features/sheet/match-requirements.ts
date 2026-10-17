import type { ItemResolution } from "../item/resolve-schema";
import type { EffectiveForProgramItem } from "../requirement/effective";
import type { SheetMatch } from "./schema";

export type MatchedProgramItem = {
  id: string;
  name: string;
  /** The program item's item with its inherited tags (`item.resolve`). */
  resolution: ItemResolution;
};

export type MatchRequirementsInput = {
  programItems: readonly MatchedProgramItem[];
  effective: readonly EffectiveForProgramItem[];
  /** Only counts of these lists are matched (the sheet definition's lists). */
  vocabularyIds: readonly string[];
};

type KindInput = { resolution: ItemResolution; valueId: string };

const carrierNames = ({ resolution, ids }: { resolution: ItemResolution; ids: string[] }) =>
  ids.map((id) => resolution.nodes.find((node) => node.itemId === id)?.name ?? id);

function matchOf({ resolution, valueId }: KindInput) {
  const contained = resolution.contains.find((tag) => tag.valueId === valueId);
  if (contained) return { kind: "CONTAINS" as const, tag: contained };
  const maybe = resolution.mayContain.find((tag) => tag.valueId === valueId);
  return maybe ? { kind: "MAY_CONTAIN" as const, tag: maybe } : null;
}

/**
 * Compares the effective counts of each program item with the tags of its item (ADR 0021): a
 * count on a value the item contains blocks the sheet, one on a value it may contain is flagged.
 * A count of 0 says "none here" and never matches. Blocking matches come first. Pure.
 */
export function matchRequirements({
  programItems,
  effective,
  vocabularyIds,
}: MatchRequirementsInput): SheetMatch[] {
  const matches: SheetMatch[] = [];
  for (const programItem of programItems) {
    const counts = effective.find((row) => row.programItemId === programItem.id)?.counts ?? [];
    for (const { vocabularyValueId, quantity } of counts) {
      const found = matchOf({ resolution: programItem.resolution, valueId: vocabularyValueId });
      if (quantity <= 0 || !found || !vocabularyIds.includes(found.tag.vocabularyId)) continue;
      matches.push({
        programItemKey: programItem.id,
        programItemName: programItem.name,
        itemId: programItem.resolution.itemId,
        itemName: programItem.resolution.name,
        vocabularyValueId,
        name: found.tag.name,
        quantity,
        kind: found.kind,
        blocking: found.kind === "CONTAINS",
        carriers: carrierNames({ resolution: programItem.resolution, ids: found.tag.itemIds }),
      });
    }
  }
  return [...matches.filter((m) => m.blocking), ...matches.filter((m) => !m.blocking)];
}
