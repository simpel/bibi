import type { ItemDto } from "@okazi/core";

/** Values of the `customisationGroupValue` message. */
export type CustomisationGroupValues = {
  name: string;
  min: number;
  max: number;
  same: string;
  options: number;
};

export type CustomisationGroupLinesInput = {
  groups: ItemDto["customisationGroups"];
  format: (values: CustomisationGroupValues) => string;
};

/** One line per customisation group, e.g. "Installation: choose 1 of 2", for `CustomisationsDisplay`. */
export function customisationGroupLines({
  groups,
  format,
}: CustomisationGroupLinesInput): string[] {
  return groups.map(({ name, minPick, maxPick, options }) =>
    format({
      name,
      min: minPick,
      max: maxPick,
      same: String(minPick === maxPick),
      options: options.length,
    }),
  );
}
