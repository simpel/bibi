import type {
  ItemStateDto,
  LineDto,
  OccupancyDto,
  OccupancyType,
  TicketDto,
} from "@okazi/core/schemas";

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
  phaseId: string | null;
  /** The ticket's one expiry date, shown on soft holds whose state expires. */
  expiresAt: Date | null;
};

export type ToCalendarBlocksInput = {
  occupancies: OccupancyDto[];
  lines: LineDto[];
  tickets: TicketDto[];
  states: ItemStateDto[];
  /** `Occupancy.sourceType` values: a ticket's own rows and a line's rows. */
  sources: { ticket: string; line: string };
};

/**
 * Joins occupancies with their source: a line's rows (and its setup time) belong to
 * the line's ticket, a ticket's own rows to that ticket.
 */
export function toCalendarBlocks({
  occupancies,
  lines,
  tickets,
  states,
  sources,
}: ToCalendarBlocksInput): CalendarBlock[] {
  const programById = new Map(lines.map((item) => [item.id, item]));
  const stateById = new Map(states.map((state) => [state.id, state]));
  const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  return occupancies.map((occupancy) => {
    const program =
      occupancy.sourceType === sources.line && occupancy.sourceId
        ? programById.get(occupancy.sourceId)
        : undefined;
    const ownTicket = occupancy.sourceType === sources.ticket ? occupancy.sourceId : null;
    const ticketId = program?.ticketId ?? ownTicket ?? null;
    const ticket = ticketId ? ticketById.get(ticketId) : undefined;
    const state = program?.stateId ? stateById.get(program.stateId) : undefined;
    const soft = occupancy.holdKind === "SOFT";
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
      heldAt: soft ? (program?.heldAt ?? null) : null,
      stateId: state?.id ?? null,
      stateName: state?.name ?? null,
      stateColor: state?.color ?? null,
      phaseId: ticket?.phaseId ?? null,
      expiresAt: soft && state?.expires ? (ticket?.holdsUntil ?? null) : null,
    };
  });
}
