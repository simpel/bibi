import type { AppErrorIssue } from "../../errors/app-error";
import type { LineCreateInput } from "../line/schema";
import type { TicketTemplateDto } from "../ticket-template/schema";

const MINUTE = 60_000;
const MAX_QUANTITY = 100_000;

/** A line to create: the line input without its ticket. */
export type PlannedLine = Omit<LineCreateInput, "ticketId">;

export type PlanTemplateLinesInput = {
  template: TicketTemplateDto;
  startsAt: Date;
  quantity: number;
};

export type TemplatePlan = { lines: PlannedLine[]; endsAt: Date; issues: AppErrorIssue[] };

/**
 * The lines a ticket made from the template gets: each starts `offsetMinutes` after the ticket's
 * start and lasts `durationMinutes`; a PER_HEADCOUNT line's quantity is its quantity (1 when
 * empty) times the headcount. `endsAt` is when the last line ends. A quantity over the limit is
 * an issue on that line.
 */
export function planTemplateLines({
  template,
  startsAt,
  quantity,
}: PlanTemplateLinesInput): TemplatePlan {
  const issues: AppErrorIssue[] = [];
  const lines = template.lines.map((line, index): PlannedLine => {
    const start = new Date(startsAt.getTime() + line.offsetMinutes * MINUTE);
    const lineQuantity =
      line.quantityBasis === "PER_HEADCOUNT" ? (line.quantity ?? 1) * quantity : line.quantity;
    if (lineQuantity !== null && lineQuantity > MAX_QUANTITY) {
      issues.push({
        path: `lines.${index}.quantity`,
        message: `"${line.name}" is over ${MAX_QUANTITY}`,
      });
    }
    return {
      entityTypeId: line.entityTypeId,
      name: line.name,
      startsAt: start,
      endsAt: new Date(start.getTime() + line.durationMinutes * MINUTE),
      itemId: line.itemId,
      setupId: line.setupId,
      quantity: lineQuantity,
    };
  });
  const ends = lines.map((line) => line.endsAt.getTime());
  return { lines, endsAt: new Date(Math.max(startsAt.getTime(), ...ends)), issues };
}
