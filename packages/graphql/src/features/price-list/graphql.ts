import {
  archivePriceList,
  createPriceList,
  getItem,
  getPriceList,
  listPriceLists,
  type PriceListDto,
  PriceListItemSchema,
  PriceListSchema,
  setPriceListItems,
  updatePriceList,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { CustomerRef } from "../customer/graphql";
import { ItemRef } from "../item/graphql";

type PriceListItemDto = PriceListDto["items"][number];

export const PriceListItemRef = objectFromSchema<PriceListItemDto>({
  name: "PriceListItem",
  schema: PriceListItemSchema,
  description: "The agreed price of one item on a price list.",
});

export const PriceListRef = objectFromSchema<PriceListDto>({
  name: "PriceList",
  schema: PriceListSchema,
  omit: ["organizationId", "items"],
  description:
    "Price list – customer prices (ADR 0023): a general discount or agreed prices per item.",
});
const PriceListPageRef = pageType({ name: "PriceListPage", item: PriceListRef });

fieldFromOperation({ operation: listPriceLists, type: PriceListPageRef, name: "priceLists" });
fieldFromOperation({ operation: getPriceList, type: PriceListRef, name: "priceList" });
mutationFromOperation({ operation: createPriceList, type: PriceListRef });
mutationFromOperation({ operation: updatePriceList, type: PriceListRef });
mutationFromOperation({ operation: setPriceListItems, type: PriceListRef });
mutationFromOperation({ operation: archivePriceList, type: PriceListRef });

builder.objectField(PriceListRef, "items", (t) =>
  t.field({
    type: [PriceListItemRef],
    description: "Agreed item prices (empty for a general discount).",
    resolve: (priceList) => priceList.items,
  }),
);

builder.objectField(PriceListRef, "customer", (t) =>
  t.field({
    type: CustomerRef,
    nullable: true,
    description: "The customer the prices apply to (null for a general list or if archived).",
    resolve: (priceList, _args, ctx) => {
      requirePermission({ ctx, permission: "customer:read" });
      return priceList.customerId ? ctx.loaders.customer.load({ id: priceList.customerId }) : null;
    },
  }),
);

builder.objectField(PriceListItemRef, "item", (t) =>
  t.field({
    type: ItemRef,
    nullable: true,
    description: "The priced item (null if archived).",
    resolve: (priceListItem, _args, ctx) =>
      runOperation({ operation: getItem, input: { id: priceListItem.itemId }, ctx }).catch(
        () => null,
      ) as never,
  }),
);

builder.objectField(CustomerRef, "priceLists", (t) =>
  t.field({
    type: [PriceListRef],
    description: "The customer's active price lists, by name.",
    resolve: async (customer, _args, ctx) => {
      const input = { customerId: customer.id, limit: 100 };
      const page = (await runOperation({ operation: listPriceLists, input, ctx })) as {
        items: PriceListDto[];
      };
      return page.items;
    },
  }),
);
