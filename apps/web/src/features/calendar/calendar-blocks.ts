import type {
  ItemStateDto,
  LineDto,
  OccupancyDto,
  OccupancyType,
  TicketDto,
} from "@bibi/core/schemas";

/** One occupancy on the calendar, with the ticket it belongs to (when it has one). */
export type CalendarBlock = {
  id: string;
  itemId: string;
  type: OccupancyType;
  startsAt: Date;
  endsAt: Date;
  ticketId: string | null;
  reference: number | null;
  /** The line's name, or the note of a manual block. */
  title: string | null;
  /** A soft hold (ADR 0044): may overlap other soft holds; drawn hatched. */
  soft: boolean;
  /** Soft holds: when the line entered its state ("held since"), so staff see who held first. */
  heldAt: Date | null;
  /** The line's state (ADR 0044): its name and color; null for manual blocks and setup time. */
  stateId: string | null;
  stateName: string | null;
  stateColor: string | null;
  statusId: string | null;
  /** The ticket's one expiry date, shown on soft holds whose state expires. */
  expiresAt: Date | null;
};

export type ToCalendarBlocksInput = {
  occupancies: OccupancyDto[];
  lines: LineDto[];
  tickets: TicketDto[];
  states: ItemStateDto[];
};

/**
 * Joins occupancies with their line (ADR 0053): a line's hold and its setup and teardown buffers
 * belong to the line's ticket; a manual block has no line and no ticket.
 */
export function toCalendarBlocks({
  occupancies,
  lines,
  tickets,
  states,
}: ToCalendarBlocksInput): CalendarBlock[] {
  const programById = new Map(lines.map((item) => [item.id, item]));
  const stateById = new Map(states.map((state) => [state.id, state]));
  const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  return occupancies.map((occupancy) => {
    const program = occupancy.lineId ? programById.get(occupancy.lineId) : undefined;
    const ticketId = program?.ticketId ?? null;
    const ticket = ticketId ? ticketById.get(ticketId) : undefined;
    const state = program?.stateId ? stateById.get(program.stateId) : undefined;
    const soft = occupancy.holdKind === "SOFT";
    // Held since and expiry belong to the hold; its buffers (ADR 0059) are labelled by type.
    const softHold = soft && occupancy.type === "HOLD";
    return {
      id: occupancy.id,
      itemId: occupancy.itemId,
      type: occupancy.type,
      startsAt: occupancy.startsAt,
      endsAt: occupancy.endsAt,
      ticketId,
      reference: ticket?.reference ?? null,
      title: program?.name ?? occupancy.note,
      soft,
      heldAt: softHold ? (program?.heldAt ?? null) : null,
      stateId: state?.id ?? null,
      stateName: state?.name ?? null,
      stateColor: state?.color ?? null,
      statusId: ticket?.statusId ?? null,
      expiresAt: softHold && state?.expires ? (ticket?.holdsUntil ?? null) : null,
    };
  });
}
