import type { LineDto } from "@bibi/core";
import { LineChooseOptionsInputSchema } from "@bibi/core/schemas";
import { formSchema } from "@/lib/form-schema";
import { type ChooseOptionsFormValues, chosenOptionsOf } from "./choose-options-schema";
import type { PickRuleText } from "./group-pick-rule";
import { withGroupRules } from "./group-rules-schema";
import type { CustomisableItem } from "./program-form-data";
import { allowsExtras, type ExtraPick, splitPicks } from "./split-picks";

export type ChooseOptionsSchemaInput = {
  lineId: string;
  item: CustomisableItem;
  ruleText: PickRuleText;
};

/**
 * Core's `line.chooseOptions` schema over the raw form values, each group's pick rule first. In a
 * group that allows extras only the first `maxPick` picks are options; the rest become add-ons
 * (ADR 0088 decision 5, `extraChanges`). Without extras the max stays a hard limit.
 */
export function chooseOptionsSchema({ lineId, item, ruleText }: ChooseOptionsSchemaInput) {
  const schema = formSchema({
    schema: LineChooseOptionsInputSchema,
    toInput: ({ values }: { values: ChooseOptionsFormValues }) => ({
      lineId,
      options: splitPicks({ groups: item.groups, picked: values.groups }).options,
    }),
  });
  return withGroupRules<ChooseOptionsFormValues, typeof schema>({
    ...{ schema, groups: item.groups, ruleText },
    chosen: ({ values }) => chosenOptionsOf({ groups: item.groups, values }),
    // `line.chooseOptions` checks every group, also when nothing is chosen.
    ...{ skipWhenNone: false, extras: true },
  });
}

/** An add-on line of the line that stands for an extra pick of one of its groups (ADR 0088). */
export type ExtraAddOn = { id: string; itemId: string };

export type ExtraAddOnsInput = {
  line: LineDto;
  lines: readonly LineDto[];
  data: { customisable: readonly CustomisableItem[] };
};

/**
 * The line's add-ons that read as extra picks: an option item of a group that allows extras,
 * with no own quantity or price. Whether it is one is derived from the item; no group is stored.
 */
export function extraAddOnsOf({ line, lines, data }: ExtraAddOnsInput): ExtraAddOn[] {
  const item = data.customisable.find(({ itemId }) => itemId === line.itemId);
  const ids = new Set(
    (item?.groups ?? [])
      .filter((group) => allowsExtras({ group }))
      .flatMap((group) => group.options.map(({ itemId }) => itemId)),
  );
  return lines.flatMap((other) =>
    other.parentLineId === line.id &&
    other.role === "ADD_ON" &&
    other.itemId !== null &&
    ids.has(other.itemId) &&
    other.quantity === null &&
    other.unitPriceMinor === null
      ? [{ id: other.id, itemId: other.itemId }]
      : [],
  );
}

export type WithExtrasInput = {
  item: CustomisableItem;
  values: ChooseOptionsFormValues;
  extras: readonly ExtraAddOn[];
};

/** The current extra picks back in their group, after the group's options. */
export function withExtras({ item, values, extras }: WithExtrasInput): ChooseOptionsFormValues {
  const groups = values.groups.map((value, index) => {
    const group = item.groups[index];
    if (!group || !allowsExtras({ group })) return value;
    const own = new Set(group.options.map(({ itemId }) => itemId));
    const more = extras
      .map(({ itemId }) => itemId)
      .filter((itemId) => own.has(itemId) && !value.picked.includes(itemId));
    return { ...value, picked: [...value.picked, ...new Set(more)] };
  });
  return { groups };
}

export type ExtraChangesInput = {
  existing: readonly ExtraAddOn[];
  picks: readonly ExtraPick[];
};

/** Which extra picks to add as add-ons and which add-ons of unpicked extras to archive. */
export function extraChanges({ existing, picks }: ExtraChangesInput) {
  const kept = new Set(picks.map(({ itemId }) => itemId));
  const have = new Set(existing.map(({ itemId }) => itemId));
  return {
    create: picks
      .filter(({ itemId }) => !have.has(itemId))
      .map(({ itemId, name }) => ({ itemId, name })),
    archive: existing.filter(({ itemId }) => !kept.has(itemId)).map(({ id }) => id),
  };
}
