import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { responsibilityKind } from "./deletion-kind";
import { getResponsibility } from "./read-operations";
import { ResponsibilityIdInputSchema } from "./schema";

export const restoreResponsibility = defineRestoreOperation({
  name: "responsibility.restore",
  description:
    "Restore an archived responsibility: it is active again, with its types and default " +
    "followers. CONFLICT when it is not archived or an active responsibility has its name.",
  permission: "responsibility:delete",
  kind: responsibilityKind,
  input: ResponsibilityIdInputSchema,
  get: getResponsibility,
});

export const deleteResponsibility = defineDeleteOperation({
  name: "responsibility.delete",
  description:
    "Delete an archived responsibility permanently (ADR 0118), with the assignees and " +
    "followers chosen on its slots. An active responsibility is CONFLICT: archive it first. " +
    "CONFLICT while a run sheet template or a run sheet names it.",
  permission: "responsibility:delete",
  kind: responsibilityKind,
  input: ResponsibilityIdInputSchema,
});
