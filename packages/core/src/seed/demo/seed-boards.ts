import { ok, type Result } from "../../errors/result";
import { createBoard } from "../../features/board/operations";
import { archiveBoardPhase, createBoardPhase } from "../../features/pipeline/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoBoard } from "./types";

export type SeedBoardsInput = {
  context: ExecuteContext;
  boards: readonly DemoBoard[];
  statusIds: ReadonlyMap<string, string>;
};

type SeedBoardInput = Omit<SeedBoardsInput, "boards"> & { board: DemoBoard };

/**
 * One board as SYSTEM: `board.create` mirrors every status in its own phase; the layout's phases
 * are then created with their statuses (each leaves its mirror phase) and the mirror phases are
 * archived, which also takes the statuses the layout leaves out off the board.
 */
async function seedBoard({ context, board, statusIds }: SeedBoardInput): Promise<Result<true>> {
  const created = await execute({ operation: createBoard, input: { name: board.name }, context });
  if (!created.ok) return created;
  const { id: boardId, phases: mirrored } = created.value;
  for (const { name, statuses } of board.phases) {
    const ids = statuses.flatMap((status) => statusIds.get(status) ?? []);
    const input = { boardId, name, statusIds: ids };
    const phase = await execute({ operation: createBoardPhase, input, context });
    if (!phase.ok) return phase;
  }
  for (const { id } of mirrored) {
    const archived = await execute({ operation: archiveBoardPhase, input: { id }, context });
    if (!archived.ok) return archived;
  }
  return ok({ value: true });
}

/** The organization's extra boards (ADR 0067), after its statuses exist. */
export async function seedDemoBoards({ boards, ...input }: SeedBoardsInput): Promise<Result<true>> {
  for (const board of boards) {
    const seeded = await seedBoard({ ...input, board });
    if (!seeded.ok) return seeded;
  }
  return ok({ value: true });
}
