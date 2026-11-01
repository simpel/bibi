import type { TicketTemplateDto } from "../../ticket-template/schema";
import type { TimedPlannedLine } from "./planned-line";

const MINUTE = 60_000;

export type PlanTemplateLinesInput = { template: TicketTemplateDto; startsAt: Date };

export type TemplatePlan = { lines: TimedPlannedLine[]; endsAt: Date };

/**
 * The lines a ticket made from the template gets: each starts `offsetMinutes` after the ticket's
 * start and lasts `durationMinutes`. The quantity is copied; an empty one stays empty, so the
 * line counts the ticket's headcount (ADR 0052). `endsAt` is when the last line ends.
 */
export function planTemplateLines({ template, startsAt }: PlanTemplateLinesInput): TemplatePlan {
  const lines = template.lines.map((line): TimedPlannedLine => {
    const start = new Date(startsAt.getTime() + line.offsetMinutes * MINUTE);
    return {
      entityTypeId: line.entityTypeId,
      name: line.name,
      startsAt: start,
      endsAt: new Date(start.getTime() + line.durationMinutes * MINUTE),
      itemId: line.itemId,
      setupId: line.setupId,
      quantity: line.quantity,
    };
  });
  const ends = lines.map((line) => line.endsAt.getTime());
  return { lines, endsAt: new Date(Math.max(startsAt.getTime(), ...ends)) };
}
