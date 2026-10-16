import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  PriceListIdInputSchema,
  PriceListListInputSchema,
  PriceListListOutputSchema,
  PriceListSchema,
} from "./schema";
import { loadPriceList, PRICE_LIST_INCLUDE, toPriceListDto } from "./to-price-list-dto";
import {
  archivePriceList,
  createPriceList,
  setPriceListItems,
  updatePriceList,
} from "./write-operations";

export const listPriceLists = defineOperation({
  name: "priceList.list",
  kind: "query",
  description:
    "List the organization's price lists (customer prices, ADR 0023), by name. Each has either " +
    "a general discount in percent or agreed prices per item, and an optional validity.",
  input: PriceListListInputSchema,
  output: PriceListListOutputSchema,
  permission: "priceList:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.priceList.findMany({
      where: input.customerId ? { customerId: input.customerId } : {},
      include: PRICE_LIST_INCLUDE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    return ok({ value: { ...page, items: page.items.map((row) => toPriceListDto({ row })) } });
  },
});

export const getPriceList = defineOperation({
  name: "priceList.get",
  kind: "query",
  description: "Get one price list by id, with its item prices.",
  input: PriceListIdInputSchema,
  output: PriceListSchema,
  permission: "priceList:read",
  handler: async ({ input, context }) => {
    const priceList = await loadPriceList({ context, id: input.id });
    return priceList ? ok({ value: priceList }) : notFound({ entity: "Price list" });
  },
});

export const priceListOperations = [
  listPriceLists,
  getPriceList,
  createPriceList,
  updatePriceList,
  setPriceListItems,
  archivePriceList,
];
