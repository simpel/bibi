import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { getStatusGridTemplate } from "../../templates/status-grid/status-grid-templates";
import { checkCell } from "./cell-rules";
import { importStatusGrid } from "./import-template";
import { loadGrid } from "./load-grid";
import {
  StatusGridGetInputSchema,
  StatusGridImportTemplateInputSchema,
  StatusGridImportTemplateOutputSchema,
  StatusGridSchema,
  StatusGridSetCellInputSchema,
} from "./schema";

export const getStatusGrid = defineOperation({
  name: "statusGrid.get",
  kind: "query",
  description:
    "Get the status grid (ADR 0044): which state each item type's lines move to when a ticket " +
    "enters a status. Only set cells are listed; a missing cell means the lines keep their state. " +
    "Closing statuses have no cells: they release every line.",
  input: StatusGridGetInputSchema,
  output: StatusGridSchema,
  permission: "pipeline:read",
  entityType: "statusStateRule",
  handler: async ({ input, context }) =>
    ok({ value: await loadGrid({ context, statusId: input.statusId }) }),
});

export const setStatusGridCell = defineOperation({
  name: "statusGrid.setCell",
  kind: "command",
  description:
    "Set or clear one cell of the status grid: when a ticket enters the (non-closing) status, its " +
    "lines of the item type that are not overridden move to the state. stateId null clears the " +
    "cell (keep the state). Existing tickets are not moved; the cell applies on the next status " +
    "move and to new lines. Returns the status's cells.",
  input: StatusGridSetCellInputSchema,
  output: StatusGridSchema,
  permission: "pipeline:write",
  entityType: "statusStateRule",
  handler: async ({ input, context }) => {
    const checked = await checkCell({ context, input });
    if (!checked.ok) return checked;
    const { statusId, entityTypeId, stateId } = input;
    const key = { statusId_entityTypeId: { statusId, entityTypeId } };
    const before = await context.db.statusStateRule.findUnique({ where: key });
    if (stateId === null) {
      if (before) {
        await context.db.statusStateRule.delete({ where: key });
        context.recordChange({ entityId: before.id, before });
      }
    } else {
      const after = await context.db.statusStateRule.upsert({
        where: key,
        create: { organizationId: context.organizationId, statusId, entityTypeId, stateId },
        update: { stateId },
      });
      context.recordChange({ entityId: after.id, before: before ?? undefined, after });
    }
    return ok({ value: await loadGrid({ context, statusId }) });
  },
});

export const importStatusGridTemplate = defineOperation({
  name: "statusGrid.importTemplate",
  kind: "command",
  description:
    "Fill the status grid from a template (ADR 0044): for every open status and item type, the " +
    "first template cell whose status has the status's name and whose state name is a state of " +
    "the type is set. Cells that are already set are kept, so it is safe to run again. " +
    "Existing tickets are not moved. Returns the number of cells set and the whole grid.",
  input: StatusGridImportTemplateInputSchema,
  output: StatusGridImportTemplateOutputSchema,
  permission: "pipeline:write",
  entityType: "statusStateRule",
  handler: ({ input, context }) =>
    importStatusGrid({ context, template: getStatusGridTemplate({ key: input.template }) }),
});

/** Every status grid operation (ADR 0044). */
export const statusGridOperations = [getStatusGrid, setStatusGridCell, importStatusGridTemplate];
