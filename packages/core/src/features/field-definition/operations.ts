import { getFieldDefinition, listFieldDefinitions } from "./read-operations";
import {
  archiveFieldDefinition,
  createFieldDefinition,
  updateFieldDefinition,
} from "./write-operations";

export const fieldDefinitionOperations = [
  listFieldDefinitions,
  getFieldDefinition,
  createFieldDefinition,
  updateFieldDefinition,
  archiveFieldDefinition,
];
