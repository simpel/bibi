import type { LineDto } from "@okazi/core";
import { nameOf } from "@/components/form/named-option";
import type { ProgramFormData } from "./program-form-data";

export type PlaceOfInput = {
  line: LineDto;
  data: ProgramFormData;
  /** Text for the item when the caller may not view items. */
  hidden?: string | undefined;
};

/** "Room · Setup", or "–" without an item. */
export const placeOf = ({ line: { itemId, setupId }, data, hidden }: PlaceOfInput) =>
  [
    nameOf({ options: data.items, id: itemId, hidden }),
    setupId ? nameOf({ options: data.setups, id: setupId }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
