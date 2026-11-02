import type { DraftAddOn as AddOnInput } from "@bibi/core";
import { numberOrNull } from "@/lib/blank";
import { type ChooseOptionsGroupValue, groupOptions } from "../../line/ui/choose-options-schema";
import type { CatalogItem } from "./catalog";
import type { DraftAddOn } from "./draft-line";
import { formTimes } from "./line-form-times";

/** One add-on row of the line dialog ("Add an item"); extra picks live in their group. */
export type AddOnFormValue = {
  itemId: string | null;
  name: string;
  /** Empty: the line's quantity. */
  quantity: string;
  /** Off: the line's time. */
  ownTime: boolean;
  from: string;
  to: string;
  /** Kept as it was; the dialog does not edit an add-on's price. */
  unitPriceMinor: number | null;
};

type Group = CatalogItem["groups"][number];

/** A pick beyond a group's max that becomes an add-on (ADR 0088 decision 5). */
export type ExtraPick = { itemId: string; name: string; groupIndex: number };

const allowsExtras = ({ group }: { group: Group }) => group.allowExtras && !group.split;

export type SplitPicksInput = {
  groups: readonly Group[];
  picked: readonly ChooseOptionsGroupValue[];
};

/**
 * The line's options and extra picks: in a group that allows extras (not split), the first
 * `maxPick` picks in the order they were picked stay options and the rest are extras.
 */
export function splitPicks({ groups, picked }: SplitPicksInput) {
  const groupValue = ({ index }: { index: number }) =>
    picked[index] ?? { picked: [], quantities: {} };
  const options = groups.flatMap((group, index) =>
    allowsExtras({ group })
      ? groupValue({ index })
          .picked.slice(0, group.maxPick)
          .map((itemId) => ({ itemId }))
      : groupOptions({ group, value: groupValue({ index }) }),
  );
  const extras = groups.flatMap((group, groupIndex): ExtraPick[] =>
    allowsExtras({ group })
      ? groupValue({ index: groupIndex })
          .picked.slice(group.maxPick)
          .map((itemId) => ({
            ...{ itemId, groupIndex },
            name: group.options.find((option) => option.itemId === itemId)?.name ?? "–",
          }))
      : [],
  );
  return { options, extras };
}

type ExtraGroupInput = { groups: readonly Group[]; addOn: DraftAddOn };

/** The group an add-on is an extra pick of: an option of a group allowing extras, no overrides. */
function extraGroupOf({ groups, addOn }: ExtraGroupInput): number {
  const plain = addOn.quantity === null && addOn.unitPriceMinor === null && !addOn.startsAt;
  if (!plain || !addOn.itemId) return -1;
  return groups.findIndex(
    (group) =>
      allowsExtras({ group }) && group.options.some(({ itemId }) => itemId === addOn.itemId),
  );
}

export type AddOnDefaultsInput = {
  groups: readonly Group[];
  /** The groups' values from the line's options. */
  picked: ChooseOptionsGroupValue[];
  addOns: readonly DraftAddOn[];
  /** `HH:mm` of an instant in the line's zone. */
  timeOf: (input: { at: string | null }) => string;
};

/** An edited line's add-ons: extra picks back in their group after its options, others as rows. */
export function addOnDefaults({ groups, picked, addOns, timeOf }: AddOnDefaultsInput) {
  const next = picked.map((value) => ({ ...value, picked: [...value.picked] }));
  const rows: AddOnFormValue[] = [];
  for (const addOn of addOns) {
    const index = extraGroupOf({ groups, addOn });
    const value = next[index];
    if (value && addOn.itemId && !value.picked.includes(addOn.itemId)) {
      value.picked.push(addOn.itemId);
      continue;
    }
    const own = addOn.startsAt !== null && addOn.endsAt !== null;
    rows.push({
      ...{ itemId: addOn.itemId, name: addOn.name, unitPriceMinor: addOn.unitPriceMinor },
      quantity: addOn.quantity === null ? "" : String(addOn.quantity),
      ...{ ownTime: own, from: own ? timeOf({ at: addOn.startsAt }) : "" },
      to: own ? timeOf({ at: addOn.endsAt }) : "",
    });
  }
  return { groups: next, rows };
}

export type AddOnInputsInput = {
  rows: readonly AddOnFormValue[];
  extras: readonly ExtraPick[];
  date: string;
  timeZone: string;
};

/** The add-ons as `ticket.create` takes them: the rows first (so issues match), then extras. */
export function addOnInputs({ rows, extras, date, timeZone }: AddOnInputsInput): AddOnInput[] {
  return [
    ...rows.map((row) => ({
      ...{ itemId: row.itemId, name: row.name, unitPriceMinor: row.unitPriceMinor },
      quantity: numberOrNull({ value: row.quantity }),
      ...(row.ownTime ? formTimes({ values: row, date, timeZone }) : {}),
    })),
    ...extras.map(({ itemId, name }) => ({ itemId, name })),
  ];
}
