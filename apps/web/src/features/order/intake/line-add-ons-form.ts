import type { DraftAddOn as AddOnInput } from "@bibi/core";
import { numberOrNull } from "@/lib/blank";
import type { DraftAddOn } from "./draft-line";
import { formTimes } from "./line-form-times";

/** One add-on row of the line dialog ("Add an item"). */
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

export type AddOnRowsInput = {
  addOns: readonly DraftAddOn[];
  /** `HH:mm` of an instant in the line's zone. */
  timeOf: (input: { at: string | null }) => string;
};

/** An edited line's add-ons as the dialog's rows. */
export function addOnRows({ addOns, timeOf }: AddOnRowsInput): AddOnFormValue[] {
  return addOns.map((addOn) => {
    const own = addOn.startsAt !== null && addOn.endsAt !== null;
    return {
      ...{ itemId: addOn.itemId, name: addOn.name, unitPriceMinor: addOn.unitPriceMinor },
      quantity: addOn.quantity === null ? "" : String(addOn.quantity),
      ...{ ownTime: own, from: own ? timeOf({ at: addOn.startsAt }) : "" },
      to: own ? timeOf({ at: addOn.endsAt }) : "",
    };
  });
}

export type AddOnInputsInput = {
  rows: readonly AddOnFormValue[];
  date: string;
  timeZone: string;
};

/** The add-ons as `order.create` takes them, in row order (so issues match). */
export function addOnInputs({ rows, date, timeZone }: AddOnInputsInput): AddOnInput[] {
  return rows.map((row) => ({
    ...{ itemId: row.itemId, name: row.name, unitPriceMinor: row.unitPriceMinor },
    quantity: numberOrNull({ value: row.quantity }),
    ...(row.ownTime ? formTimes({ values: row, date, timeZone }) : {}),
  }));
}
