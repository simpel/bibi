import type { LineDto } from "@bibi/core";
import { nameOf } from "@/components/form/named-option";
import type { ProgramFormData } from "./program-form-data";

export type PlaceOfInput = {
  line: LineDto;
  data: ProgramFormData;
  /** Text for the item when the caller may not view items. */
  hidden?: string | undefined;
};

/** "Room · Layout", or "–" without an item. */
export const placeOf = ({ line: { itemId, layoutId }, data, hidden }: PlaceOfInput) =>
  [
    nameOf({ options: data.items, id: itemId, hidden }),
    layoutId
      ? nameOf({
          options: data.items.find((item) => item.id === itemId)?.layouts ?? [],
          id: layoutId,
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
