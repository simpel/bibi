import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { PriceListItemDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckTermsInput = Db & {
  customerId?: string | null | undefined;
  validFrom?: Date | null | undefined;
  validTo?: Date | null | undefined;
};

/** The customer is active and the validity is not reversed (both dates inclusive). */
export async function checkTerms({
  context,
  customerId,
  validFrom,
  validTo,
}: CheckTermsInput): Promise<Result<true>> {
  if (validFrom && validTo && validFrom > validTo) {
    const message = "The price list must not end before it starts";
    return invalid({ message, issues: [{ path: "validTo", message }] });
  }
  if (customerId && !(await context.db.customer.findFirst({ where: { id: customerId } }))) {
    const message = "Unknown customer";
    return invalid({ message, issues: [{ path: "customerId", message }] });
  }
  return ok({ value: true });
}

export type CheckPricingInput = {
  discountPercent?: number | null | undefined;
  itemCount: number;
  /** The input field the issue is reported on. */
  path: "discountPercent" | "items";
};

/** ADR 0023: a price list has either a general discount or item prices, never both. */
export function checkPricing({
  discountPercent,
  itemCount,
  path,
}: CheckPricingInput): Result<true> {
  if (discountPercent != null && itemCount > 0) {
    const message = "A price list has either a general discount or item prices, not both";
    return invalid({ message, issues: [{ path, message }] });
  }
  return ok({ value: true });
}

export type CheckItemsInput = Db & { items: readonly PriceListItemDto[] };

/** Each item is active, has the PRICED behaviour and is listed at most once. */
export async function checkItems({ context, items }: CheckItemsInput): Promise<Result<true>> {
  const ids = items.map((item) => item.itemId);
  if (new Set(ids).size !== ids.length) {
    const message = "An item is listed twice";
    return invalid({ message, issues: [{ path: "items", message }] });
  }
  const found = await context.db.item.count({
    where: { id: { in: ids }, entityType: { behaviours: { has: "PRICED" } } },
  });
  if (found !== ids.length) {
    const message = "Unknown item, or an item without the PRICED behaviour";
    return invalid({ message, issues: [{ path: "items", message }] });
  }
  return ok({ value: true });
}

export type DefinedOnlyInput<T extends object> = { data: T };

/** Drops the keys left out of a patch, so they do not override the stored values. */
export function definedOnly<T extends object>({ data }: DefinedOnlyInput<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
