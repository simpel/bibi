import { NONE } from "@/components/form/option-select-field";
import {
  type ChooseOptionsFormValues,
  chooseOptionsDefaults,
  groupOptions,
} from "../../line/ui/choose-options-schema";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import type { NeedsFormValues } from "./line-needs-fields";

type Groups = CatalogItem["groups"];

/** An item's groups that need a pick (minPick 1 or more, ADR 0089). */
export const requiredGroups = ({ groups }: { groups: Groups }) =>
  groups.filter((group) => group.minPick >= 1);

export type ChoiceKeysInput = {
  lines: readonly DraftLine[];
  items: readonly Pick<CatalogItem, "id" | "groups">[];
};

/** The keys of the lines whose item has a required group: what the choices step asks. */
export function choiceKeysOf({ lines, items }: ChoiceKeysInput): string[] {
  const required = new Set(
    items.filter(({ groups }) => requiredGroups({ groups }).length > 0).map(({ id }) => id),
  );
  return lines.filter((line) => line.itemId && required.has(line.itemId)).map(({ key }) => key);
}

export type ChoiceValues = ChooseOptionsFormValues & NeedsFormValues;

export type ChoiceDefaultsInput = { line: DraftLine; groups: Groups };

/** The step's raw values for a line: its choices per group and its needs. */
export const choiceDefaults = ({ line, groups }: ChoiceDefaultsInput): ChoiceValues => ({
  groups: chooseOptionsDefaults({
    item: { itemId: line.itemId ?? "", groups },
    chosen: line.options,
  }).groups,
  needs: line.needs.map(({ vocabularyValueId, quantity }) => ({
    ...{ valueId: vocabularyValueId, count: String(quantity) },
  })),
});

export type WithChoicesInput = ChoiceDefaultsInput & {
  values: ChoiceValues;
  /** The requirement type needs are counted with; null keeps the line's needs. */
  needTypeId: string | null;
};

/**
 * The line with what the choices step says (ADR 0089): its required groups' options replaced,
 * other options kept, and its needs (rows without a value or count are left out).
 */
export function withChoices({ line, groups, values, needTypeId }: WithChoicesInput): DraftLine {
  const required = groups.flatMap((group, index) => (group.minPick >= 1 ? [{ group, index }] : []));
  const asked = new Set(required.flatMap(({ group }) => group.options.map(({ itemId }) => itemId)));
  const chosen = required.flatMap(({ group, index }) =>
    groupOptions({ group, value: values.groups[index] ?? { picked: [], quantities: {} } }).map(
      (option: { itemId: string; quantity?: number }) => ({
        itemId: option.itemId,
        quantity: option.quantity ?? null,
      }),
    ),
  );
  const needs = needTypeId
    ? values.needs.flatMap(({ valueId, count }) => {
        const quantity = Number(count);
        if (valueId === "" || valueId === NONE || !(quantity > 0)) return [];
        return [{ entityTypeId: needTypeId, vocabularyValueId: valueId, quantity }];
      })
    : line.needs;
  const kept = line.options.filter(({ itemId }) => !asked.has(itemId));
  return { ...line, options: [...kept, ...chosen], needs };
}

/** How many required groups of the lines have nothing chosen. */
export function openChoiceCount({ lines, items }: ChoiceKeysInput): number {
  return lines.reduce((total, line) => {
    const groups = requiredGroups({
      groups: items.find(({ id }) => id === line.itemId)?.groups ?? [],
    });
    const chosen = new Set(line.options.map(({ itemId }) => itemId));
    return (
      total +
      groups.filter((group) => !group.options.some(({ itemId }) => chosen.has(itemId))).length
    );
  }, 0);
}
