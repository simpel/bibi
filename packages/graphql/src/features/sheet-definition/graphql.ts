import {
  archiveSheetDefinition,
  createSheetDefinition,
  getSheetDefinition,
  listSheetDefinitions,
  type SheetDefinitionDto,
  SheetDefinitionSchema,
  updateSheetDefinition,
} from "@okazi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const SheetDefinitionRef = objectFromSchema<SheetDefinitionDto>({
  name: "SheetDefinition",
  schema: SheetDefinitionSchema,
  omit: ["organizationId"],
  description:
    "Sheet definition – an organization's own sheet (e.g. Kitchen order): included item types, " +
    "fields and lists, and the receiving role.",
});
const SheetDefinitionPageRef = pageType({ name: "SheetDefinitionPage", item: SheetDefinitionRef });

fieldFromOperation({
  operation: listSheetDefinitions,
  type: SheetDefinitionPageRef,
  name: "sheetDefinitions",
});
fieldFromOperation({
  operation: getSheetDefinition,
  type: SheetDefinitionRef,
  name: "sheetDefinition",
});
mutationFromOperation({ operation: createSheetDefinition, type: SheetDefinitionRef });
mutationFromOperation({ operation: updateSheetDefinition, type: SheetDefinitionRef });
mutationFromOperation({ operation: archiveSheetDefinition, type: SheetDefinitionRef });
