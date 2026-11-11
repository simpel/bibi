import { saveItemAsBundle } from "./bundle-operations";
import { archiveItem } from "./lifecycle-operations";
import { freeUnits } from "./pool-operations";
import { getItem, listItems } from "./read-operations";
import { resolveItem } from "./resolve-operation";
import { summarizeItems } from "./summary-operation";
import { createItem, updateItem } from "./write-operations";

export const itemOperations = [
  listItems,
  getItem,
  summarizeItems,
  resolveItem,
  freeUnits,
  createItem,
  updateItem,
  archiveItem,
  saveItemAsBundle,
];
