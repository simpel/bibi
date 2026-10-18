import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { checkCell } from "./cell-rules";
import { loadGrid } from "./load-grid";
import { PhaseGridGetInputSchema, PhaseGridSchema, PhaseGridSetCellInputSchema } from "./schema";

export const getPhaseGrid = defineOperation({
  name: "phaseGrid.get",
  kind: "query",
  description:
    "Get the phase grid (ADR 0044): which state each item type's lines move to when a ticket " +
    "enters a phase. Only set cells are listed; a missing cell means the lines keep their state. " +
    "Terminal phases have no cells: they release every line.",
  input: PhaseGridGetInputSchema,
  output: PhaseGridSchema,
  permission: "phaseGrid:read",
  entityType: "phaseStateRule",
  handler: async ({ input, context }) =>
    ok({ value: await loadGrid({ context, phaseId: input.phaseId }) }),
});

export const setPhaseGridCell = defineOperation({
  name: "phaseGrid.setCell",
  kind: "command",
  description:
    "Set or clear one cell of the phase grid: when a ticket enters the (non-terminal) phase, its " +
    "lines of the item type that are not overridden move to the state. stateId null clears the " +
    "cell (keep the state). Existing tickets are not moved; the cell applies on the next phase " +
    "move and to new lines. Returns the phase's cells.",
  input: PhaseGridSetCellInputSchema,
  output: PhaseGridSchema,
  permission: "phaseGrid:admin",
  entityType: "phaseStateRule",
  handler: async ({ input, context }) => {
    const checked = await checkCell({ context, input });
    if (!checked.ok) return checked;
    const { phaseId, entityTypeId, stateId } = input;
    const key = { phaseId_entityTypeId: { phaseId, entityTypeId } };
    const before = await context.db.phaseStateRule.findUnique({ where: key });
    if (stateId === null) {
      if (before) {
        await context.db.phaseStateRule.delete({ where: key });
        context.recordChange({ entityId: before.id, before });
      }
    } else {
      const after = await context.db.phaseStateRule.upsert({
        where: key,
        create: { organizationId: context.organizationId, phaseId, entityTypeId, stateId },
        update: { stateId },
      });
      context.recordChange({ entityId: after.id, before: before ?? undefined, after });
    }
    return ok({ value: await loadGrid({ context, phaseId }) });
  },
});

/** Every phase grid operation (ADR 0044). */
export const phaseGridOperations = [getPhaseGrid, setPhaseGridCell];
