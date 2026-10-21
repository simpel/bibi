import type { EntityTypeDto, ItemDto } from "@okazi/core";
import type { PRICE_UNITS, PriceEffect } from "@okazi/core/schemas";
import { type BufferFormValues, bufferFormDefaults } from "@/components/form/buffer-values";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";

export type PriceUnitValue = (typeof PRICE_UNITS)[number];

/** One part of a BUNDLE item as raw form values. */
export type PartFormValue = {
  itemId: string;
  quantity: string;
  offsetMinutes: string;
  durationMinutes: string;
  required: boolean;
};

/** One option of a customisation group: another item ("" = not picked yet) and its price effect. */
export type CustomisationOptionFormValue = { itemId: string; priceEffect: PriceEffect };

/** One customisation group of a CUSTOMISATIONS item as raw form values. */
export type CustomisationGroupFormValue = {
  name: string;
  minPick: string;
  maxPick: string;
  options: CustomisationOptionFormValue[];
};

/** Raw values of the item form: inputs are strings; kr, not minor units; one entry per field key. */
export type ItemFormValues = BufferFormValues & {
  entityTypeId: string;
  venueId: string;
  name: string;
  description: string;
  fields: Record<string, RawFieldValue>;
  price: string;
  priceUnit: PriceUnitValue;
  vatRatePercent: string;
  defaultDurationMinutes: string;
  /** Capacity per setup id; "" = the setup is not used. */
  setups: Record<string, string>;
  parts: PartFormValue[];
  customisationGroups: CustomisationGroupFormValue[];
};

export const NO_VENUE = "none";

const text = ({ value }: { value: number | string | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

export type ItemDefaultsInput = { type: EntityTypeDto | undefined; item?: ItemDto | undefined };

export function itemFormDefaults({ type, item }: ItemDefaultsInput): ItemFormValues {
  const setups: Record<string, string> = {};
  for (const { setupId, capacity } of item?.setups ?? []) setups[setupId] = String(capacity);
  return {
    entityTypeId: type?.id ?? "",
    venueId: item?.venueId ?? NO_VENUE,
    name: item?.name ?? "",
    description: item?.description ?? "",
    fields: rawFields({ type, stored: item?.fields ?? {} }),
    price: item?.priceMinor == null ? "" : String(item.priceMinor / 100),
    priceUnit: item?.priceUnit ?? "PER_UNIT",
    vatRatePercent: text({ value: item?.vatRatePercent }),
    defaultDurationMinutes: text({ value: item?.defaultDurationMinutes }),
    ...bufferFormDefaults({ stored: item }),
    setups,
    parts: (item?.parts ?? []).map((part) => ({
      itemId: part.itemId,
      quantity: String(part.quantity),
      offsetMinutes: String(part.offsetMinutes),
      durationMinutes: text({ value: part.durationMinutes }),
      required: part.required,
    })),
    customisationGroups: (item?.customisationGroups ?? []).map((group) => ({
      name: group.name,
      minPick: String(group.minPick),
      maxPick: String(group.maxPick),
      options: group.options.map(({ itemId, priceEffect }) => ({ itemId, priceEffect })),
    })),
  };
}
