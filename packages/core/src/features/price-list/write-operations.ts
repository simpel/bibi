import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkItems, checkPricing, checkTerms, definedOnly } from "./price-list-rules";
import {
  PriceListCreateInputSchema,
  PriceListIdInputSchema,
  PriceListSchema,
  PriceListSetItemsInputSchema,
  PriceListUpdateInputSchema,
} from "./schema";
import { loadPriceList, PRICE_LIST_INCLUDE, toPriceListDto } from "./to-price-list-dto";

export const createPriceList = defineOperation({
  name: "priceList.create",
  kind: "command",
  description:
    "Create a price list (customer prices, ADR 0023), optionally for one customer and with a " +
    "validity (inclusive dates). Give either a general `discountPercent` here, or leave it out " +
    "and set agreed item prices with priceList.setItems; a list never has both.",
  input: PriceListCreateInputSchema,
  output: PriceListSchema,
  permission: "priceList:write",
  handler: async ({ input, context }) => {
    const terms = await checkTerms({ context, ...input });
    if (!terms.ok) return terms;
    const row = await context.db.priceList.create({
      data: { ...input, organizationId: context.organizationId },
      include: PRICE_LIST_INCLUDE,
    });
    const priceList = toPriceListDto({ row });
    context.recordChange({ entityId: row.id, after: priceList });
    return ok({ value: priceList });
  },
});

export const updatePriceList = defineOperation({
  name: "priceList.update",
  kind: "command",
  description:
    "Update a price list's name, customer, validity or general discount. Omitted properties " +
    "are unchanged; null clears one. Refused to set a discount while the list has item prices.",
  input: PriceListUpdateInputSchema,
  output: PriceListSchema,
  permission: "priceList:write",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await loadPriceList({ context, id });
    if (!before) return notFound({ entity: "Price list" });
    const merged = { ...before, ...definedOnly({ data }) };
    const terms = await checkTerms({ context, ...merged });
    if (!terms.ok) return terms;
    const pricing = checkPricing({
      ...merged,
      itemCount: before.items.length,
      path: "discountPercent",
    });
    if (!pricing.ok) return pricing;
    const row = await context.db.priceList.update({
      where: { id },
      data,
      include: PRICE_LIST_INCLUDE,
    });
    const priceList = toPriceListDto({ row });
    context.recordChange({ entityId: id, before, after: priceList });
    return ok({ value: priceList });
  },
});

export const setPriceListItems = defineOperation({
  name: "priceList.setItems",
  kind: "command",
  description:
    "Set a price list's agreed item prices. The given items replace the whole current set; an " +
    "empty list clears it. Each item must be active and PRICED. Refused while the list has a " +
    "general discount (clear it with priceList.update first).",
  input: PriceListSetItemsInputSchema,
  output: PriceListSchema,
  permission: "priceList:write",
  handler: async ({ input: { id, items }, context }) => {
    const before = await loadPriceList({ context, id });
    if (!before) return notFound({ entity: "Price list" });
    const pricing = checkPricing({ ...before, itemCount: items.length, path: "items" });
    if (!pricing.ok) return pricing;
    const checked = await checkItems({ context, items });
    if (!checked.ok) return checked;
    await context.db.priceListItem.deleteMany({ where: { priceListId: id } });
    await context.db.priceListItem.createMany({
      data: items.map((item) => ({
        ...item,
        priceListId: id,
        organizationId: context.organizationId,
      })),
    });
    const after = await loadPriceList({ context, id });
    context.recordChange({ entityId: id, before, after });
    return after ? ok({ value: after }) : notFound({ entity: "Price list" });
  },
});

export const archivePriceList = defineOperation({
  name: "priceList.archive",
  kind: "command",
  description: "Archive (soft-delete) a price list. New order lines no longer use its prices.",
  input: PriceListIdInputSchema,
  output: PriceListSchema,
  permission: "priceList:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await loadPriceList({ context, id });
    if (!before) return notFound({ entity: "Price list" });
    const row = await context.db.priceList.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: PRICE_LIST_INCLUDE,
    });
    const priceList = toPriceListDto({ row });
    context.recordChange({ entityId: id, before, after: priceList });
    return ok({ value: priceList });
  },
});
