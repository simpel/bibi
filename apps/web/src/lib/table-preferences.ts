/** Preference keys under which a user's column order per table is stored (`userPreference`). */
export const TABLE_COLUMNS_PREFIX = "table.columns.";

export type TableColumnsKeyInput = { tableId: string };

export function tableColumnsKey({ tableId }: TableColumnsKeyInput): string {
  return `${TABLE_COLUMNS_PREFIX}${tableId}`;
}

export type ParseTableOrdersInput = { preferences: Record<string, unknown> };

type ColumnOrderOfInput = { value: unknown };

/** The value as a list of column ids, or `null` when it is anything else. */
function columnOrderOf({ value }: ColumnOrderOfInput): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((id) => typeof id === "string") ? (value as string[]) : null;
}

/** Saved orders by table id; entries that are not a list of column ids are ignored. */
export function parseTableOrders({ preferences }: ParseTableOrdersInput): Record<string, string[]> {
  const orders: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(preferences)) {
    const order = key.startsWith(TABLE_COLUMNS_PREFIX) ? columnOrderOf({ value }) : null;
    if (order) orders[key.slice(TABLE_COLUMNS_PREFIX.length)] = order;
  }
  return orders;
}
