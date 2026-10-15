export type FieldLinesInput = { fields: Record<string, unknown> };

/** `key: value` lines of a typed record's field values; empty values are skipped. */
export function fieldLines({ fields }: FieldLinesInput): string[] {
  return Object.entries(fields).flatMap(([key, value]) => {
    if (value === null || value === undefined || value === "") return [];
    const text = Array.isArray(value) ? value.join(", ") : String(value);
    return text === "" ? [] : [`${key}: ${text}`];
  });
}
