import { getSheetDefinition, listSheetDefinitions } from "./read-operations";
import {
  archiveSheetDefinition,
  createSheetDefinition,
  updateSheetDefinition,
} from "./write-operations";

export const sheetDefinitionOperations = [
  listSheetDefinitions,
  getSheetDefinition,
  createSheetDefinition,
  updateSheetDefinition,
  archiveSheetDefinition,
];
