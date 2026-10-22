import {
  archiveItemDemand,
  createItemDemand,
  getItemDemand,
  type ItemDemandDto,
  ItemDemandSchema,
  listItemDemands,
  updateItemDemand,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const ItemDemandRef = objectFromSchema<ItemDemandDto>({
  name: "ItemDemand",
  schema: ItemDemandSchema,
  omit: ["organizationId"],
  description:
    "Item demand – what an item asks of a pool (ADR 0059): a specific item or an item type " +
    "plus list values, mandatory or optional, how many units and which line windows.",
});
const ItemDemandPageRef = pageType({ name: "ItemDemandPage", item: ItemDemandRef });

fieldFromOperation({ operation: listItemDemands, type: ItemDemandPageRef, name: "itemDemands" });
fieldFromOperation({ operation: getItemDemand, type: ItemDemandRef, name: "itemDemand" });
mutationFromOperation({ operation: createItemDemand, type: ItemDemandRef });
mutationFromOperation({ operation: updateItemDemand, type: ItemDemandRef });
mutationFromOperation({ operation: archiveItemDemand, type: ItemDemandRef });
