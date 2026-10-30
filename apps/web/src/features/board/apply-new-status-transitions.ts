import "server-only";
import {
  getBoard,
  listTicketStatuses,
  type Result,
  setTicketStatusTransitions,
  type TicketStatusDto,
} from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { newStatusTransitions } from "./lib/new-status-transitions";

export type ApplyNewStatusTransitionsInput = {
  created: TicketStatusDto;
  /** The board the status was made on; its phase order decides the targets. */
  boardId?: string | undefined;
};

/** Saves the default transitions of a status made in customize mode (`ticketStatus.setTransitions`). */
export async function applyNewStatusTransitions({
  created,
  boardId,
}: ApplyNewStatusTransitionsInput): Promise<Result<null>> {
  const [statuses, board] = await Promise.all([
    runOperation({ operation: listTicketStatuses, input: { limit: 100 } }),
    boardId ? runOperation({ operation: getBoard, input: { id: boardId } }) : null,
  ]);
  if (!statuses.ok) return statuses;
  const boardOrder = board?.ok ? board.value.phases.flatMap((phase) => phase.statusIds) : [];
  const updates = newStatusTransitions({ created, statuses: statuses.value.items, boardOrder });
  for (const input of updates) {
    const result = await runOperation({ operation: setTicketStatusTransitions, input });
    if (!result.ok) return result;
  }
  return { ok: true, value: null };
}
