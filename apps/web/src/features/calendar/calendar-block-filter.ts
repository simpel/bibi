import type { CalendarBlock } from "./calendar-blocks";
import type { CalendarParams } from "./calendar-params";

export type FilterBlocksInput = {
  blocks: CalendarBlock[];
  params: Pick<CalendarParams, "stateId" | "phaseId" | "ticketId">;
};

/**
 * Narrows the blocks by line state, ticket phase and ticket. Blocks without a state (setup time,
 * manual blocks) are hidden while a state or phase filter is on, because they match neither.
 */
export function filterBlocks({ blocks, params }: FilterBlocksInput): CalendarBlock[] {
  const { stateId, phaseId, ticketId } = params;
  return blocks.filter(
    (block) =>
      (!stateId || block.stateId === stateId) &&
      (!phaseId || block.phaseId === phaseId) &&
      (!ticketId || block.ticketId === ticketId),
  );
}
