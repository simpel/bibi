import type { OperationContext } from "../../operations/types";
import type { ItemChoiceGroupInput } from "./choice-group-schema";
import { replaceChoiceGroups } from "./item-choice-groups";
import { replaceComponents } from "./item-components";
import type { ItemDto } from "./schema";

type Components = ItemDto["components"];

/** The parts and choice groups an item has after a write. */
export type Composition = { components: Components; choiceGroups: ItemChoiceGroupInput[] };

export type PlanCompositionInput = {
  /** The item before the change; undefined on create. */
  before?: ItemDto | undefined;
  components: Components | undefined;
  choiceGroups: ItemChoiceGroupInput[] | undefined;
};

/**
 * What the parts and groups become, or undefined when the write touches neither. A side that is
 * left out keeps its current value, so changed parts are checked against the existing groups.
 */
export function planComposition({
  before,
  components,
  choiceGroups,
}: PlanCompositionInput): Composition | undefined {
  if (components === undefined && choiceGroups === undefined) return undefined;
  return {
    components: components ?? before?.components ?? [],
    choiceGroups: choiceGroups ?? before?.choiceGroups ?? [],
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
    await replaceComponents({ context, itemId, components: composition.components });
  }
  await replaceChoiceGroups({ context, itemId, choiceGroups: composition.choiceGroups });
}
