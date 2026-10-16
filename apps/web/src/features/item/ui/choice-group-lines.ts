import type { ItemDto } from "@okazi/core";

/** Values of the `choiceGroupValue` message. */
export type ChoiceGroupValues = {
  name: string;
  min: number;
  max: number;
  same: string;
  options: number;
};

export type ChoiceGroupLinesInput = {
  groups: ItemDto["choiceGroups"];
  format: (values: ChoiceGroupValues) => string;
};

/** One line per choice group, e.g. "Main course: choose 1 of 4", for `ChoicesDisplay`. */
export function choiceGroupLines({ groups, format }: ChoiceGroupLinesInput): string[] {
  return groups.map(({ name, minPick, maxPick, itemIds }) =>
    format({
      name,
      min: minPick,
      max: maxPick,
      same: String(minPick === maxPick),
      options: itemIds.length,
    }),
  );
}
