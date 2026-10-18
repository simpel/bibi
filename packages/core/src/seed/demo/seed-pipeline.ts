import { ok, type Result } from "../../errors/result";
import { setTicketPhaseTransitions } from "../../features/ticket-phase/order-operations";
import { createTicketPhase } from "../../features/ticket-phase/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { seedDemoGrid } from "./seed-grid";
import type { DemoPipeline } from "./types";

export type SeedPipelineInput = { context: ExecuteContext; pipeline: DemoPipeline };

/** Creates the phases in order through `ticketPhase.create`; returns their ids by name. */
async function createPhases({ context, pipeline }: SeedPipelineInput) {
  const ids = new Map<string, string>();
  for (const phase of pipeline.phases.phases) {
    const created = await execute({ operation: createTicketPhase, input: phase, context });
    if (!created.ok) return created;
    ids.set(phase.name, created.value.id);
  }
  return ok({ value: ids });
}

type TransitionsInput = SeedPipelineInput & { ids: ReadonlyMap<string, string> };

/** The phases' transitions, one `ticketPhase.setTransitions` per phase they leave. */
async function setTransitions({ context, pipeline, ids }: TransitionsInput): Promise<Result<true>> {
  for (const [name, id] of ids) {
    const toPhaseIds = pipeline.phases.transitions
      .filter(([from]) => from === name)
      .flatMap(([, to]) => ids.get(to) ?? []);
    const input = { id, toPhaseIds };
    const set = await execute({ operation: setTicketPhaseTransitions, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}

/**
 * The organization's pipeline (ADR 0043, 0044, 0025) as SYSTEM: phases with flags and
 * transitions, then the phase grid. After the item types and their states exist, before any
 * ticket. The organization was provisioned without the default phases (`pipeline: "none"`).
 */
export async function seedDemoPipeline({
  context,
  pipeline,
}: SeedPipelineInput): Promise<Result<true>> {
  const input = { context, pipeline };
  const created = await createPhases(input);
  if (!created.ok) return created;
  const transitions = await setTransitions({ ...input, ids: created.value });
  if (!transitions.ok) return transitions;
  return seedDemoGrid({ context, cells: pipeline.cells });
}
