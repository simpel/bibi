import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadStatesOfType } from "../item-state/load-item-state";
import { loadGrid } from "../phase-grid/load-grid";
import { loadAllTicketPhases } from "../ticket-phase/load-ticket-phase";
import { activateGrid } from "./activate-grid";
import { finishPhases, upsertPhases } from "./activate-phases";
import { activateType, type SetUpType } from "./activate-states";
import { previewPipeline } from "./preview";
import { resolveBookable } from "./resolve-types";
import type { PipelineActivateOutput, PipelineSetupDraft } from "./schema";

export type ActivatePipelineInput = { context: OperationContext; draft: PipelineSetupDraft };

/** The preview must have no errors; each error becomes an issue of the `VALIDATION`. */
async function checkReady({ context, draft }: ActivatePipelineInput): Promise<Result<true>> {
  const bookable = await resolveBookable({ context, draft });
  if (!bookable.ok) return bookable;
  const preview = previewPipeline({ draft, bookable: bookable.value });
  if (preview.ready) return ok({ value: true });
  const issues = preview.problems
    .filter((row) => row.severity === "error")
    .map((row) => ({ path: row.code, message: row.message }));
  return invalid({ message: "The pipeline setup has problems; see the preview", issues });
}

/**
 * `pipelineSetup.activate` (ADR 0044): item types and states, phases, the grid, then the phases
 * the draft left out are archived and the order and transitions set, all through the normal
 * operations in the caller's one transaction and audit batch.
 */
export async function activatePipeline({
  context,
  draft,
}: ActivatePipelineInput): Promise<Result<PipelineActivateOutput>> {
  const ready = await checkReady({ context, draft });
  if (!ready.ok) return ready;
  const types = new Map<string, SetUpType>();
  for (const type of draft.itemTypes) {
    const setUp = await activateType({ context, draft: type });
    if (!setUp.ok) return setUp;
    types.set(type.name, setUp.value);
  }
  const phaseIds = await upsertPhases({ context, phases: draft.phases });
  if (!phaseIds.ok) return phaseIds;
  const grid = await activateGrid({ context, draft, phaseIds: phaseIds.value, types });
  if (!grid.ok) return grid;
  const finished = await finishPhases({ context, phases: draft.phases, ids: phaseIds.value });
  if (!finished.ok) return finished;
  // One query at a time: the transaction's connection runs them in order anyway.
  const states = [];
  for (const { entityTypeId } of types.values()) {
    states.push(await loadStatesOfType({ context, entityTypeId }));
  }
  return ok({
    value: {
      phases: await loadAllTicketPhases({ context }),
      states: states.flat(),
      grid: await loadGrid({ context }),
    },
  });
}
