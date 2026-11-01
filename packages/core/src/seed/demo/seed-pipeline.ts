import { ok, type Result } from "../../errors/result";
import {
  setTicketStatusGates,
  setTicketStatusTransitions,
} from "../../features/ticket-status/order-operations";
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
  for (const { name, color, gatesIn: _gatesIn, ...flags } of pipeline.statuses.statuses) {
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

type MovesInput = SeedPipelineInput & { ids: ReadonlyMap<string, string> };

/**
 * The statuses' move rules (ADR 0076): the template's gates on moves into each status from any
 * status (`gatesIn`), and the few statuses that only allow some moves.
 */
async function setMoveRules({ context, pipeline, ids }: MovesInput): Promise<Result<true>> {
  for (const { name, gatesIn = [] } of pipeline.statuses.statuses) {
    const id = ids.get(name);
    if (!id || gatesIn.length === 0) continue;
    const input = { id, gates: [{ fromStatusId: null, gates: [...gatesIn] }] };
    const set = await execute({ operation: setTicketStatusGates, input, context });
    if (!set.ok) return set;
  }
  for (const { from, to } of pipeline.restrictedMoves ?? []) {
    const id = ids.get(from);
    if (!id) continue;
    const toStatusIds = to.flatMap((name) => ids.get(name) ?? []);
    const input = { id, allowedNext: "ONLY_THESE" as const, toStatusIds };
    const set = await execute({ operation: setTicketStatusTransitions, input, context });
    if (!set.ok) return set;
  }
  return ok({ value: true });
}

/**
 * The organization's pipeline (ADR 0043, 0044, 0025) as SYSTEM: statuses with flags and
 * move rules, then the status grid. After the item types and their states exist, before any
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
  const moves = await setMoveRules({ ...input, ids: created.value });
  if (!moves.ok) return moves;
  const boards = await seedDemoBoards({
    context,
    boards: pipeline.boards ?? [],
    statusIds: created.value,
  });
  if (!boards.ok) return boards;
  return seedDemoGrid({ context, cells: pipeline.cells });
}
