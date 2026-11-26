import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { entityTypeKind } from "./deletion-kind";
import { getEntityType } from "./read-operations";
import { EntityTypeIdInputSchema } from "./schema";

export const restoreEntityType = defineRestoreOperation({
  name: "entityType.restore",
  description:
    "Restore an archived type: it is active again, with the fields it had. CONFLICT when it is " +
    "not archived or an active type has its name.",
  permission: "configuration:delete",
  kind: entityTypeKind,
  input: EntityTypeIdInputSchema,
  get: getEntityType,
});

export const deleteEntityType = defineDeleteOperation({
  name: "entityType.delete",
  description:
    "Delete an archived type permanently (ADR 0118), with its fields, item states and status " +
    "grid cells. An active type is CONFLICT: archive it first. CONFLICT while any record of it " +
    "(archived or not), a package or order version line, a board, an inbox address, a demand, " +
    "another type's link field or an active responsibility or run sheet template uses it.",
  permission: "configuration:delete",
  kind: entityTypeKind,
  input: EntityTypeIdInputSchema,
});
