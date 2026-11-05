import { getRunSheetDefinition, listRunSheetDefinitions } from "./read-operations";
import {
  archiveRunSheetDefinition,
  createRunSheetDefinition,
  updateRunSheetDefinition,
} from "./write-operations";

export const runSheetDefinitionOperations = [
  listRunSheetDefinitions,
  getRunSheetDefinition,
  createRunSheetDefinition,
  updateRunSheetDefinition,
  archiveRunSheetDefinition,
];
