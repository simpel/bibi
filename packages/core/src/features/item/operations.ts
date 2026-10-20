import { saveItemAsBundle } from "./bundle-operations";
import { archiveItem } from "./lifecycle-operations";
import { getItem, listItems } from "./read-operations";
import { resolveItem } from "./resolve-operation";
import { createItem, updateItem } from "./write-operations";

export const itemOperations = [
  listItems,
  getItem,
  resolveItem,
  createItem,
  updateItem,
  archiveItem,
  saveItemAsBundle,
];
