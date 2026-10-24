import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { setStatusGridCell } from "../status-grid/operations";
import type { SetUpType } from "./activate-states";
import type { PipelineSetupDraft } from "./schema";

export type ActivateGridInput = {
  context: OperationContext;
  draft: PipelineSetupDraft;
  statusIds: Map<string, string>;
  types: Map<string, SetUpType>;
};

/**
 * Sets every grid cell of the draft's open statuses and item types through `statusGrid.setCell`:
 * the draft's state, or cleared ("keep the state") where the draft has no cell.
 */
export async function activateGrid({
  context,
  draft,
  statusIds,
  types,
}: ActivateGridInput): Promise<Result<true>> {
  for (const ticketStatus of draft.statuses.filter((row) => !row.closes)) {
    for (const type of draft.itemTypes) {
      const setUp = types.get(type.name);
      const statusId = statusIds.get(ticketStatus.name);
      if (!setUp || !statusId) continue;
      const cell = draft.cells.find(
        (row) => row.ticketStatus === ticketStatus.name && row.type === type.name,
      );
      const stateId = cell ? (setUp.stateIds.get(cell.state) ?? null) : null;
      const input = { statusId, entityTypeId: setUp.entityTypeId, stateId };
      const set = await runNested({ operation: setStatusGridCell, input, context });
      if (!set.ok) return set;
    }
  }
  return ok({ value: true });
}
