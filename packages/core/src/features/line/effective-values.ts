import type {
  DiscountSource,
  LineEffective,
  PriceSource,
  QuantitySource,
  VatSource,
} from "./effective-schema";

type Sourced<T, S> = { value: T; source: S | null };

export type Headcount = {
  estimatedHeadcount: number | null;
  guaranteedHeadcount: number | null;
};

export type EffectiveQuantityInput = { quantity: number | null; ticket: Headcount };

/** ADR 0052: the line's own quantity, else the guaranteed headcount, else the estimate. */
export function effectiveQuantity({
  quantity,
  ticket,
}: EffectiveQuantityInput): Sourced<number | null, QuantitySource> {
  if (quantity !== null) return { value: quantity, source: "LINE" };
  if (ticket.guaranteedHeadcount !== null) {
    return { value: ticket.guaranteedHeadcount, source: "GUARANTEED_HEADCOUNT" };
  }
  if (ticket.estimatedHeadcount !== null) {
    return { value: ticket.estimatedHeadcount, source: "ESTIMATED_HEADCOUNT" };
  }
  return { value: null, source: null };
}

/** The customer's price list in effect for a line: a price per item or a general discount. */
export type PriceTerms = {
  /** Agreed prices by item id. */
  prices: ReadonlyMap<string, number>;
  discountPercent: number | null;
};

export type EffectivePriceInput = {
  line: { unitPriceMinor: number | null; discountPercent: number | null };
  item: { id: string; priceMinor: number | null } | null;
  terms: PriceTerms | null;
};

/**
 * ADR 0052: unit price line → price list → item. Discount line → the price list's general
 * discount, which applies to the item's own price only (an agreed or overridden price is net).
 */
export function effectivePrice({ line, item, terms }: EffectivePriceInput) {
  const listed = item ? terms?.prices.get(item.id) : undefined;
  const price: Sourced<number | null, PriceSource> =
    line.unitPriceMinor !== null
      ? { value: line.unitPriceMinor, source: "LINE" }
      : listed !== undefined
        ? { value: listed, source: "PRICE_LIST" }
        : item && item.priceMinor !== null
          ? { value: item.priceMinor, source: "ITEM" }
          : { value: null, source: null };
  const listDiscount = terms?.discountPercent ?? null;
  const discount: Sourced<number, DiscountSource> =
    line.discountPercent !== null
      ? { value: line.discountPercent, source: "LINE" }
      : listDiscount !== null && price.source === "ITEM"
        ? { value: listDiscount, source: "PRICE_LIST" }
        : { value: 0, source: null };
  return { price, discount };
}

export type EffectiveVatInput = {
  line: { vatRatePercent: number | null };
  item: { vatRatePercent: number | null; venueVatRatePercent: number | null } | null;
};

/** ADR 0052: VAT line → item → the item's venue default. */
export function effectiveVat({ line, item }: EffectiveVatInput): Sourced<number | null, VatSource> {
  if (line.vatRatePercent !== null) return { value: line.vatRatePercent, source: "LINE" };
  if (item?.vatRatePercent != null) return { value: item.vatRatePercent, source: "ITEM" };
  if (item?.venueVatRatePercent != null) {
    return { value: item.venueVatRatePercent, source: "VENUE" };
  }
  return { value: null, source: null };
}

export type EffectiveOfInput = {
  line: EffectivePriceInput["line"] & EffectiveVatInput["line"] & { quantity: number | null };
  ticket: Headcount;
  item: (EffectivePriceInput["item"] & EffectiveVatInput["item"]) | null;
  terms: PriceTerms | null;
};

/** All effective values of one line, flat as the line DTO carries them. */
export function effectiveOf({ line, ticket, item, terms }: EffectiveOfInput): LineEffective {
  const amount = effectiveQuantity({ quantity: line.quantity, ticket });
  const { price, discount } = effectivePrice({ line, item, terms });
  const vat = effectiveVat({ line, item });
  return {
    ...{ effectiveQuantity: amount.value, quantitySource: amount.source },
    ...{ effectiveUnitPriceMinor: price.value, unitPriceSource: price.source },
    ...{ effectiveDiscountPercent: discount.value, discountSource: discount.source },
    ...{ effectiveVatRatePercent: vat.value, vatRateSource: vat.source },
  };
}
