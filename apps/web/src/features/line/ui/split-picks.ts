import { type ChooseOptionsGroupValue, groupOptions } from "./choose-options-schema";
import type { CustomisableItem } from "./program-form-data";

type Group = CustomisableItem["groups"][number];

/** A pick beyond a group's max that becomes an add-on (ADR 0088 decision 5). */
export type ExtraPick = { itemId: string; name: string; groupIndex: number };

/** A group whose picks beyond the max are add-ons: it allows extras and is not split. */
export const allowsExtras = ({ group }: { group: Group }) => group.allowExtras && !group.split;

export type SplitPicksInput = {
  groups: readonly Group[];
  picked: readonly ChooseOptionsGroupValue[];
};

/**
 * The line's options and extra picks: in a group that allows extras (not split), the first
 * `maxPick` picks in the order they were picked stay options and the rest are extras. Shared by
 * the intake's line dialog and the ticket page's options form.
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
