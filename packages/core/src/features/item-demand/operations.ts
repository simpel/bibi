import { getItemDemand, listItemDemands } from "./read-operations";
import { archiveItemDemand, createItemDemand, updateItemDemand } from "./write-operations";

export { archiveItemDemand, createItemDemand, getItemDemand, listItemDemands, updateItemDemand };

export const itemDemandOperations = [
  listItemDemands,
  getItemDemand,
  createItemDemand,
  updateItemDemand,
  archiveItemDemand,
];
