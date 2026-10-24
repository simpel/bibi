import type { CalendarBlock } from "./calendar-blocks";
import type { CalendarParams } from "./calendar-params";

export type FilterBlocksInput = {
  blocks: CalendarBlock[];
  params: Pick<CalendarParams, "stateId" | "statusId" | "ticketId">;
};

/**
 * Narrows the blocks by line state, ticket status and ticket. Blocks without a state (setup time,
 * manual blocks) are hidden while a state or status filter is on, because they match neither.
 */
export function filterBlocks({ blocks, params }: FilterBlocksInput): CalendarBlock[] {
  const { stateId, statusId, ticketId } = params;
  return blocks.filter(
    (block) =>
      (!stateId || block.stateId === stateId) &&
      (!statusId || block.statusId === statusId) &&
      (!ticketId || block.ticketId === ticketId),
  );
}
