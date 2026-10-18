import "server-only";
import { listBookingStatuses, type PipelineBoard, pipelineBoard, type Result } from "@okazi/core";
import { runOperation } from "@/server/run-operation";

export type PipelineData = {
  board: PipelineBoard;
  /** Booking status id → the ids it may move to (`bookingStatus.list` transitionsTo). */
  transitions: Record<string, string[]>;
};

const LIMIT = 100;

/** The board plus the booking transitions the drag rules need. */
export async function loadPipelineData(): Promise<Result<PipelineData>> {
  const [board, statuses] = await Promise.all([
    runOperation({ operation: pipelineBoard, input: {} }),
    runOperation({ operation: listBookingStatuses, input: { limit: LIMIT } }),
  ]);
  if (!board.ok) return board;
  if (!statuses.ok) return statuses;
  const transitions = Object.fromEntries(
    statuses.value.items.map(({ id, transitionsTo }) => [id, transitionsTo]),
  );
  return { ok: true, value: { board: board.value, transitions } };
}
