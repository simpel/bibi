import type { LineDto } from "@bibi/core";
import { loadTicketDays } from "../ticket-days";
import type { ProgramFormData } from "./program-form-data";
import { TicketDayList } from "./ticket-day-list";

export type TicketDayProps = { ticketId: string; lines: LineDto[]; data: ProgramFormData };

/**
 * The ticket's days in the calendar: per day, everything booked in the organization, the other
 * tickets' dimmed and this ticket's lines solid (the intake's snapshot, ADR 0081).
 */
export async function TicketDay({ ticketId, lines, data }: TicketDayProps) {
  const days = await loadTicketDays({ ticketId, lines, data });
  return <TicketDayList {...days} />;
}
