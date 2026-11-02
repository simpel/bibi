import "server-only";
import {
  getTicket,
  type LineAmounts,
  type LineDto,
  lineAmounts,
  listLines,
  ok,
  type Result,
} from "@bibi/core";
import { loadProgramData } from "@/features/line/load-program-data";
import { nestedLines } from "@/features/line/nested-lines";
import { loadTicketDays, type TicketDays } from "@/features/line/ticket-days";
import type { ProgramFormData } from "@/features/line/ui/program-form-data";
import { runOperation } from "@/server/run-operation";
import { loadSheetFacts, type TicketSheetFacts } from "./load-sheet-facts";

/** The program part of the sheet; null when the caller may not read the program. */
export type SheetProgram = {
  lines: LineDto[];
  data: ProgramFormData;
  amounts: LineAmounts | null;
  days: TicketDays;
};

/** Everything the ticket sheet shows, read once when it opens. */
export type TicketSheetData = TicketSheetFacts & {
  id: string;
  title: string | null;
  reference: number;
  program: SheetProgram | null;
};

/** The ticket's lines with their amounts and its days in the calendar. */
async function loadProgram({ ticketId }: { ticketId: string }): Promise<SheetProgram | null> {
  const [lines, data, amounts] = await Promise.all([
    runOperation({ operation: listLines, input: { ticketId, limit: 100 } }),
    loadProgramData(),
    runOperation({ operation: lineAmounts, input: { ticketId } }),
  ]);
  if (!lines.ok || !data.ok) return null;
  const items = nestedLines({ lines: lines.value.items });
  const days = await loadTicketDays({ ticketId, lines: items, data: data.value });
  return { lines: items, data: data.value, amounts: amounts.ok ? amounts.value : null, days };
}

/**
 * The ticket sheet (pipeline and calendar): the ticket, its people, its days in the calendar
 * and its lines, read through the operations the ticket page uses (ADR 0050 composition).
 */
export async function loadTicketSheet({ id }: { id: string }): Promise<Result<TicketSheetData>> {
  const ticket = await runOperation({ operation: getTicket, input: { id } });
  if (!ticket.ok) return ticket;
  const [facts, program] = await Promise.all([
    loadSheetFacts({ ticket: ticket.value }),
    loadProgram({ ticketId: id }),
  ]);
  const { title, reference } = ticket.value;
  return ok({ value: { id, title, reference, ...facts, program } });
}
