import type { AccountingSettingsDto } from "./settings-schema";

/** An order line as a provider row reads it: its item (and type) and its frozen VAT rows. */
export type SoldLine = {
  itemId: string | null;
  vatRows: unknown;
  item: { entityTypeId: string } | null;
};

export type RevenueAccountOf = (input: { line: SoldLine }) => string;

/** The revenue account of a line: the item's, else its type's, else the default (null = inherit). */
export function revenueAccountResolver({
  settings,
}: {
  settings: AccountingSettingsDto;
}): RevenueAccountOf {
  const byItem = new Map<string, string>();
  const byType = new Map<string, string>();
  for (const row of settings.revenueAccounts) {
    if (row.itemId) byItem.set(row.itemId, row.account);
    if (row.entityTypeId) byType.set(row.entityTypeId, row.account);
  }
  return ({ line }) =>
    (line.itemId ? byItem.get(line.itemId) : undefined) ??
    (line.item ? byType.get(line.item.entityTypeId) : undefined) ??
    settings.revenueAccount;
}
