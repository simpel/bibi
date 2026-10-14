import type { EntityTypeDto, ItemDto } from "@okazi/core";
import type { PRICE_UNITS } from "@okazi/core/schemas";

export type RawFieldValue = string | boolean | string[];
export type PriceUnitValue = (typeof PRICE_UNITS)[number];

/** Raw values of the item form: inputs are strings; kr, not öre; one entry per field key. */
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
};

export const NO_VENUE = "none";

const text = ({ value }: { value: number | string | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

type RawInput = { type: EntityTypeDto | undefined; stored: Record<string, unknown> };

/** Raw field values for a type: stored values of an item where present, else empty. */
export function rawFields({ type, stored }: RawInput): Record<string, RawFieldValue> {
  const raw: Record<string, RawFieldValue> = {};
  for (const { key, kind } of type?.fields ?? []) {
    const value = stored[key];
    if (kind === "BOOLEAN") raw[key] = value === true;
    else if (kind === "MULTI_CHOICE") raw[key] = Array.isArray(value) ? value.map(String) : [];
    else raw[key] = text({ value: value as number | string | null | undefined });
  }
  return raw;
}

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
  };
}
