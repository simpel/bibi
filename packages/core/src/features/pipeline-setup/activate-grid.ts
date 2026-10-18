import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { setPhaseGridCell } from "../phase-grid/operations";
import type { SetUpType } from "./activate-states";
import type { PipelineSetupDraft } from "./schema";

export type ActivateGridInput = {
  context: OperationContext;
  draft: PipelineSetupDraft;
  phaseIds: Map<string, string>;
  types: Map<string, SetUpType>;
};

/**
 * Sets every grid cell of the draft's open phases and item types through `phaseGrid.setCell`:
 * the draft's state, or cleared ("keep the state") where the draft has no cell.
 */
export async function activateGrid({
  context,
  draft,
  phaseIds,
  types,
}: ActivateGridInput): Promise<Result<true>> {
  for (const phase of draft.phases.filter((row) => !row.terminal)) {
    for (const type of draft.itemTypes) {
      const setUp = types.get(type.name);
      const phaseId = phaseIds.get(phase.name);
      if (!setUp || !phaseId) continue;
      const cell = draft.cells.find((row) => row.phase === phase.name && row.type === type.name);
      const stateId = cell ? (setUp.stateIds.get(cell.state) ?? null) : null;
      const input = { phaseId, entityTypeId: setUp.entityTypeId, stateId };
      const set = await runNested({ operation: setPhaseGridCell, input, context });
      if (!set.ok) return set;
    }
  }
  return ok({ value: true });
}
