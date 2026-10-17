import type { ProgramItemDto } from "@okazi/core";
import { nameOf } from "@/components/form/named-option";
import type { ProgramFormData } from "./program-form-data";

export type PlaceOfInput = { programItem: ProgramItemDto; data: ProgramFormData };

/** "Room · Setup", or "–" without an item. */
export const placeOf = ({ programItem: { itemId, setupId }, data }: PlaceOfInput) =>
  [
    nameOf({ options: data.items, id: itemId }),
    setupId ? nameOf({ options: data.setups, id: setupId }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
