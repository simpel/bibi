/** A chosen customisation option of a draft line (ADR 0082): a quantity only in a split group. */
export type DraftOption = { itemId: string; quantity: number | null };

/** A need on a draft line: a count per list value of a requirement type (ADR 0081 decision 6). */
export type DraftNeed = { entityTypeId: string; vocabularyValueId: string; quantity: number };

/**
 * An add-on under a draft line (ADR 0088): any item sold with the line at its own price. Its
 * quantity and time follow the line unless set.
 */
export type DraftAddOn = {
  /** Stable within the line; never sent to core. */
  key: string;
  itemId: string | null;
  name: string;
  /** Null: the line's quantity. */
  quantity: number | null;
  /** Override; null inherits the price list or item (never the line's discount). */
  unitPriceMinor: number | null;
  /** Both null: the line's period. */
  startsAt: string | null;
  endsAt: string | null;
};

/**
 * One line of the booking being built, kept in the browser until Create (ADR 0081). Times are
 * ISO instants so the draft survives storage; both null is an untimed line (ADR 0052).
 */
export type DraftLine = {
  /** Stable within the intake; never sent to core. */
  key: string;
  entityTypeId: string;
  name: string;
  itemId: string | null;
  setupId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  /** Null: one per guest, follows the headcount. */
  quantity: number | null;
  /** Overrides; null inherits the price list or item. */
  unitPriceMinor: number | null;
  discountPercent: number | null;
  note: string | null;
  options: DraftOption[];
  needs: DraftNeed[];
  /** Add-ons under the line, as extra picks or any item (ADR 0088). */
  addOns: DraftAddOn[];
  /** The line type's own field values, typed, by key. */
  fields: Record<string, unknown>;
};

/** Makes the stable keys of new draft lines; the page passes a random one, tests a counter. */
export type NewKey = () => string;

export const isTimed = ({ line }: { line: DraftLine }): boolean =>
  line.startsAt !== null && line.endsAt !== null;

/** The quantity the line has: its own, else the headcount. */
export const quantityOf = ({ line, headcount }: { line: DraftLine; headcount: number }) =>
  line.quantity ?? headcount;
