import type { OperationContext } from "../../operations/types";
import type { ItemCustomisationGroupInput } from "./customisation-group-schema";
import { replaceCustomisationGroups } from "./item-customisation-groups";
import { replaceParts } from "./item-parts";
import type { ItemDto } from "./schema";

type Parts = ItemDto["parts"];

/** The parts and customisation groups an item has after a write. */
export type Composition = { parts: Parts; customisationGroups: ItemCustomisationGroupInput[] };

export type PlanCompositionInput = {
  /** The item before the change; undefined on create. */
  before?: ItemDto | undefined;
  parts: Parts | undefined;
  customisationGroups: ItemCustomisationGroupInput[] | undefined;
};

/**
 * What the parts and groups become, or undefined when the write touches neither. A side that is
 * left out keeps its current value, so changed parts are checked against the existing groups.
 */
export function planComposition({
  before,
  parts,
  customisationGroups,
}: PlanCompositionInput): Composition | undefined {
  if (parts === undefined && customisationGroups === undefined) return undefined;
  return {
    parts: parts ?? before?.parts ?? [],
    customisationGroups: customisationGroups ?? before?.customisationGroups ?? [],
  };
}

export type WriteCompositionInput = {
  context: OperationContext;
  itemId: string;
  /** Whether the parts themselves changed (otherwise only the groups are rewritten). */
  partsChanged: boolean;
  composition: Composition | undefined;
};

/** Writes the planned parts and then the groups that link them. */
export async function writeComposition({
  context,
  itemId,
  partsChanged,
  composition,
}: WriteCompositionInput) {
  if (!composition) return;
  if (partsChanged) {
    await replaceParts({ context, itemId, parts: composition.parts });
  }
  await replaceCustomisationGroups({
    context,
    itemId,
    customisationGroups: composition.customisationGroups,
  });
}
