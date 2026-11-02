import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import type { IntakePeriod } from "./intake-period";

/** How many items the empty state offers. No "most used" signal exists yet: the first ones. */
export const QUICK_ADD_COUNT = 6;

export type QuickLineInput = {
  item: CatalogItem;
  lineTypeId: string;
  period: IntakePeriod | null;
  key: string;
};

/**
 * A line of an item as quick-add makes it: a bookable item from the ticket's start for its
 * default length (else to the ticket's end), any other item untimed; one per guest.
 */
export function quickLine({ item, lineTypeId, period, key }: QuickLineInput): DraftLine {
  const bookable = period !== null && item.capabilities.includes("BOOKABLE");
  const minutes = item.defaultDurationMinutes;
  const endsAt =
    bookable && period
      ? minutes
        ? new Date(period.startsAt.getTime() + minutes * 60_000)
        : period.endsAt
      : null;
  return {
    ...{ key, entityTypeId: lineTypeId, name: item.name, itemId: item.id, setupId: null },
    startsAt: bookable && period ? period.startsAt.toISOString() : null,
    endsAt: endsAt?.toISOString() ?? null,
    ...{ quantity: null, unitPriceMinor: null, discountPercent: null, note: null },
    ...{ options: [], needs: [], addOns: [], fields: {} },
  };
}
