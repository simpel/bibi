import { archiveItem } from "./lifecycle-operations";
import { saveItemAsPackage } from "./package-operations";
import { getItem, listItems } from "./read-operations";
import { createItem, updateItem } from "./write-operations";

export const itemOperations = [
  listItems,
  getItem,
  createItem,
  updateItem,
  archiveItem,
  saveItemAsPackage,
];
