import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { runSheetDefinitionKind } from "./deletion-kind";
import { getRunSheetDefinition } from "./read-operations";
import { RunSheetDefinitionIdInputSchema } from "./schema";

export const restoreRunSheetDefinition = defineRestoreOperation({
  name: "runSheetDefinition.restore",
  description:
    "Restore an archived run sheet template: it is active again. CONFLICT when it is not " +
    "archived or its responsibility is archived.",
  permission: "template:delete",
  kind: runSheetDefinitionKind,
  input: RunSheetDefinitionIdInputSchema,
  get: getRunSheetDefinition,
});

export const deleteRunSheetDefinition = defineDeleteOperation({
  name: "runSheetDefinition.delete",
  description:
    "Delete an archived run sheet template permanently (ADR 0118). An active template is " +
    "CONFLICT: archive it first. CONFLICT while any run sheet was made from it.",
  permission: "template:delete",
  kind: runSheetDefinitionKind,
  input: RunSheetDefinitionIdInputSchema,
});
