import type { ItemWire } from "@okazi/ai";

export type FieldLinesInput = { fields: ItemWire["fields"] };

/** `key: value` lines of an item's field values; empty values are skipped. */
export function fieldLines({ fields }: FieldLinesInput): string[] {
  return Object.entries(fields).flatMap(([key, value]) => {
    if (value === null || value === undefined || value === "") return [];
    const text = Array.isArray(value) ? value.join(", ") : String(value);
    return text === "" ? [] : [`${key}: ${text}`];
  });
}
