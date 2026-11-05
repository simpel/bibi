import {
  archiveRunSheetDefinition,
  createRunSheetDefinition,
  getRunSheetDefinition,
  listRunSheetDefinitions,
  updateRunSheetDefinition,
  type RunSheetDefinitionDto,
  RunSheetDefinitionSchema,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const RunSheetDefinitionRef = objectFromSchema<RunSheetDefinitionDto>({
  name: "RunSheetDefinition",
  schema: RunSheetDefinitionSchema,
  omit: ["organizationId"],
  description:
    "Run sheet definition – an organization's own run sheet (e.g. Kitchen order): included item types, " +
    "fields and lists, and the receiving role.",
});
const RunSheetDefinitionPageRef = pageType({
  name: "RunSheetDefinitionPage",
  item: RunSheetDefinitionRef,
});

fieldFromOperation({
  operation: listRunSheetDefinitions,
  type: RunSheetDefinitionPageRef,
  name: "runSheetDefinitions",
});
fieldFromOperation({
  operation: getRunSheetDefinition,
  type: RunSheetDefinitionRef,
  name: "runSheetDefinition",
});
mutationFromOperation({ operation: createRunSheetDefinition, type: RunSheetDefinitionRef });
mutationFromOperation({ operation: updateRunSheetDefinition, type: RunSheetDefinitionRef });
mutationFromOperation({ operation: archiveRunSheetDefinition, type: RunSheetDefinitionRef });
