import type { AccountMap, RevenuePart, VatPart } from "../../accounting/sie4/accounts";
import { asVatRows } from "../quote/order-line-schema";
import type { AccountingSettingsDto } from "./settings-schema";

/** The fixed accounts of the settings as the voucher builder takes them (ADR 0077). */
export function toAccountMap({ settings }: { settings: AccountingSettingsDto }): AccountMap {
  return {
    receivable: settings.receivableAccount,
    clearing: settings.clearingAccount,
    advances: settings.advancesAccount,
    fees: settings.feesAccount,
    rounding: settings.roundingAccount,
    vatOutput: { 25: settings.vat25Account, 12: settings.vat12Account, 6: settings.vat6Account },
  };
}

/** An order line as the export reads it: its item (and type) and its frozen VAT rows. */
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

export type RevenuePartsInput = { lines: readonly SoldLine[]; accountOf: RevenueAccountOf };

/** One revenue part per line and VAT rate, from the frozen `vatRows` (bundles split, ADR 0059). */
export function revenueParts({ lines, accountOf }: RevenuePartsInput): RevenuePart[] {
  return lines.flatMap((line) =>
    asVatRows({ value: line.vatRows }).map((row) => ({
      account: accountOf({ line }),
      vatRatePercent: row.vatRatePercent,
      exclVatMinor: row.totalExclVatMinor,
      vatMinor: row.vatMinor,
    })),
  );
}

/** A deposit's stored VAT split as parts (ADR 0093); `[]` when it carries no VAT. */
export const vatParts = ({ vatRows }: { vatRows: unknown }): VatPart[] =>
  asVatRows({ value: vatRows }).map((row) => ({
    vatRatePercent: row.vatRatePercent,
    exclVatMinor: row.totalExclVatMinor,
    vatMinor: row.vatMinor,
  }));
