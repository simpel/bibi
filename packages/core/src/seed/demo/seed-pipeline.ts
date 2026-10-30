import { ok, type Result } from "../../errors/result";
import { setTicketStatusTransitions } from "../../features/ticket-status/order-operations";
import {
  createTicketStatus,
  updateTicketStatus,
} from "../../features/ticket-status/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { seedDemoBoards } from "./seed-boards";
import { seedDefaultBoard } from "./seed-default-board";
import { seedDemoGrid } from "./seed-grid";
import type { DemoPipeline } from "./types";

export type SeedPipelineInput = { context: ExecuteContext; pipeline: DemoPipeline };

/**
 * Creates the statuses in order through `ticketStatus.create` (a name and a colour), then sets
 * each one's flags and event with `ticketStatus.update`; returns their ids by name.
 */
async function createStatuses({ context, pipeline }: SeedPipelineInput) {
  const ids = new Map<string, string>();
  for (const { name, color, ...flags } of pipeline.statuses.statuses) {
    const input = { name, color };
    const created = await execute({ operation: createTicketStatus, input, context });
    if (!created.ok) return created;
    const update = { id: created.value.id, ...flags };
    const updated = await execute({ operation: updateTicketStatus, input: update, context });
    if (!updated.ok) return updated;
    ids.set(name, created.value.id);
  }
  return ok({ value: ids });
}

type TransitionsInput = SeedPipelineInput & { ids: ReadonlyMap<string, string> };

/** The statuses' transitions, one `ticketStatus.setTransitions` per status they leave. */
async function setTransitions({ context, pipeline, ids }: TransitionsInput): Promise<Result<true>> {
  for (const [name, id] of ids) {
    const toStatusIds = pipeline.statuses.transitions
      .filter(([from]) => from === name)
      .flatMap(([, to]) => ids.get(to) ?? []);
    const input = { id, toStatusIds };
    const set = await execute({ operation: setTicketStatusTransitions, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}

/**
 * The organization's pipeline (ADR 0043, 0044, 0025) as SYSTEM: statuses with flags and
 * transitions, then the status grid. After the item types and their states exist, before any
 * ticket. The organization was provisioned without the default statuses (`pipeline: "none"`).
 */
export async function seedDemoPipeline({
  context,
  pipeline,
}: SeedPipelineInput): Promise<Result<true>> {
  const input = { context, pipeline };
  const created = await createStatuses(input);
  if (!created.ok) return created;
  const placed = await seedDefaultBoard({ ...input, ids: created.value });
  if (!placed.ok) return placed;
  const transitions = await setTransitions({ ...input, ids: created.value });
  if (!transitions.ok) return transitions;
  const boards = await seedDemoBoards({
    context,
    boards: pipeline.boards ?? [],
    statusIds: created.value,
  });
  if (!boards.ok) return boards;
  return seedDemoGrid({ context, cells: pipeline.cells });
}
