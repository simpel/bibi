import "server-only";
import { listTicketPhases, type PipelineBoard, pipelineBoard, type Result } from "@okazi/core";
import { runOperation } from "@/server/run-operation";

export type PipelineData = {
  board: PipelineBoard;
  /** Ticket phase id → the ids it may move to (`ticketPhase.list` transitionsTo). */
  transitions: Record<string, string[]>;
};

const LIMIT = 100;

/** The board plus the ticket transitions the drag rules need. */
export async function loadPipelineData(): Promise<Result<PipelineData>> {
  const [board, phases] = await Promise.all([
    runOperation({ operation: pipelineBoard, input: {} }),
    runOperation({ operation: listTicketPhases, input: { limit: LIMIT } }),
  ]);
  if (!board.ok) return board;
  if (!phases.ok) return phases;
  const transitions = Object.fromEntries(
    phases.value.items.map(({ id, transitionsTo }) => [id, transitionsTo]),
  );
  return { ok: true, value: { board: board.value, transitions } };
}
