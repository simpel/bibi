import type { EntityTypeDto, ItemDto } from "@okazi/core";
import type { PRICE_UNITS } from "@okazi/core/schemas";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";

export type PriceUnitValue = (typeof PRICE_UNITS)[number];

/** One part of a COMPOSABLE item as raw form values. */
export type ComponentFormValue = {
  itemId: string;
  quantity: string;
  offsetMinutes: string;
  durationMinutes: string;
  required: boolean;
};

/** Raw values of the item form: inputs are strings; kr, not minor units; one entry per field key. */
export type ItemFormValues = {
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
  components: ComponentFormValue[];
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
    setups,
    components: (item?.components ?? []).map((component) => ({
      itemId: component.itemId,
      quantity: String(component.quantity),
      offsetMinutes: String(component.offsetMinutes),
      durationMinutes: text({ value: component.durationMinutes }),
      required: component.required,
    })),
  };
}
