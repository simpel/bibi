import { ok, type Result } from "../../errors/result";
import { listBoards } from "../../features/board/operations";
import { createBoardPhase } from "../../features/pipeline/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoPipeline } from "./types";

export type SeedDefaultBoardInput = {
  context: ExecuteContext;
  pipeline: DemoPipeline;
  ids: ReadonlyMap<string, string>;
};

/**
 * One column per status on the default board, as a template import gives it: `ticketStatus.create`
 * leaves a new status off the board, so the seed places each one itself (`boardPhase.create`).
 * Open statuses go after the open ones already there, closing ones last.
 */
export async function seedDefaultBoard({
  context,
  pipeline,
  ids,
}: SeedDefaultBoardInput): Promise<Result<true>> {
  const boards = await execute({ operation: listBoards, input: { limit: 1 }, context });
  if (!boards.ok) return boards;
  const board = boards.value.items[0];
  if (!board) return ok({ value: true });
  const placed = new Set(board.phases.flatMap((phase) => phase.statusIds));
  let open = pipeline.statuses.statuses.filter(
    (status) => !status.closes && placed.has(ids.get(status.name) ?? ""),
  ).length;
  for (const { name, color, closes } of pipeline.statuses.statuses) {
    const id = ids.get(name);
    if (!id || placed.has(id)) continue;
    const position = closes ? undefined : open++;
    const input = {
      boardId: board.id,
      name,
      color,
      statusIds: [id],
      ...(position === undefined ? {} : { position }),
    };
    const phase = await execute({ operation: createBoardPhase, input, context });
    if (!phase.ok) return phase;
  }
  return ok({ value: true });
}
