import {
  archiveWorkOrderDefinition,
  createWorkOrderDefinition,
  getWorkOrderDefinition,
  listWorkOrderDefinitions,
  updateWorkOrderDefinition,
  type WorkOrderDefinitionDto,
  WorkOrderDefinitionSchema,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const WorkOrderDefinitionRef = objectFromSchema<WorkOrderDefinitionDto>({
  name: "WorkOrderDefinition",
  schema: WorkOrderDefinitionSchema,
  omit: ["organizationId"],
  description:
    "Work order definition – an organization's own work order (e.g. Kitchen order): included item types, " +
    "fields and lists, and the receiving role.",
});
const WorkOrderDefinitionPageRef = pageType({
  name: "WorkOrderDefinitionPage",
  item: WorkOrderDefinitionRef,
});

fieldFromOperation({
  operation: listWorkOrderDefinitions,
  type: WorkOrderDefinitionPageRef,
  name: "workOrderDefinitions",
});
fieldFromOperation({
  operation: getWorkOrderDefinition,
  type: WorkOrderDefinitionRef,
  name: "workOrderDefinition",
});
mutationFromOperation({ operation: createWorkOrderDefinition, type: WorkOrderDefinitionRef });
mutationFromOperation({ operation: updateWorkOrderDefinition, type: WorkOrderDefinitionRef });
mutationFromOperation({ operation: archiveWorkOrderDefinition, type: WorkOrderDefinitionRef });
