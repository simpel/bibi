import { getEntityType, listEntityTypes } from "./read-operations";
import { archiveEntityType, createEntityType, updateEntityType } from "./write-operations";

export const entityTypeOperations = [
  listEntityTypes,
  getEntityType,
  createEntityType,
  updateEntityType,
  archiveEntityType,
];
