import { archiveItem } from "./lifecycle-operations";
import { getItem, listItems } from "./read-operations";
import { createItem, updateItem } from "./write-operations";

export const itemOperations = [listItems, getItem, createItem, updateItem, archiveItem];
