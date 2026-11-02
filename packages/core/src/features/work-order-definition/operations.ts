import { getWorkOrderDefinition, listWorkOrderDefinitions } from "./read-operations";
import {
  archiveWorkOrderDefinition,
  createWorkOrderDefinition,
  updateWorkOrderDefinition,
} from "./write-operations";

export const workOrderDefinitionOperations = [
  listWorkOrderDefinitions,
  getWorkOrderDefinition,
  createWorkOrderDefinition,
  updateWorkOrderDefinition,
  archiveWorkOrderDefinition,
];
