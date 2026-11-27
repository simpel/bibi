import type { LedgerMappings } from "./load-mappings";

/** An order line as a provider row reads it: its item (and type) and its frozen VAT rows. */
export type SoldLine = {
  itemId: string | null;
  vatRows: unknown;
  item: { entityTypeId: string } | null;
};

export type RevenueAccountOf = (input: { line: SoldLine }) => string;

/**
 * The account reference of a line (ADR 0123): its item type's mapping, else the default revenue
 * mapping. Callers have checked that the default exists (`requireMappings`).
 */
export function revenueAccountResolver({
  mappings,
  defaultRevenue,
}: {
  mappings: LedgerMappings;
  defaultRevenue: string;
}): RevenueAccountOf {
  return ({ line }) =>
    (line.item ? mappings.byType.get(line.item.entityTypeId) : undefined) ?? defaultRevenue;
}
