import type { DateTimeFormat, WorkOrderDto } from "@bibi/core/schemas";
import { desiredPeriod } from "@/features/ticket/ui/desired-period";

type Named = { id: string; name: string };

/** What the table shows of a work order, formatted on the server. */
export type WorkOrderRow = {
  id: string;
  ticketId: string;
  ticketLabel: string;
  definition: string;
  responsibility: string;
  when: string;
  version: number;
  current: boolean;
  blocked: boolean;
  /** Formatted time it was sent, null while it has not been. */
  sentAt: string | null;
};

export type WorkOrderRowsInput = {
  items: WorkOrderDto[];
  definitions: Named[];
  responsibilities: Named[];
  format: DateTimeFormat;
};

const nameOf = ({ rows, id }: { rows: Named[]; id: string }) =>
  rows.find((row) => row.id === id)?.name ?? "–";

/** Rows for the table: names from the lookups, the ticket row's label and period, times formatted. */
export function toWorkOrderRows({
  items,
  definitions,
  responsibilities,
  format,
}: WorkOrderRowsInput): WorkOrderRow[] {
  return items.map((item) => {
    const ticket = item.content.rows.find((row) => row.kind === "TICKET");
    return {
      id: item.id,
      ticketId: item.ticketId,
      ticketLabel: ticket?.label ?? "–",
      definition: nameOf({ rows: definitions, id: item.workOrderDefinitionId }),
      responsibility: nameOf({ rows: responsibilities, id: item.responsibilityId }),
      when: ticket
        ? desiredPeriod({
            ticket: { desiredStartsAt: ticket.startsAt, desiredEndsAt: ticket.endsAt },
            format,
          })
        : "–",
      version: item.version,
      current: item.current,
      blocked: item.blocked,
      sentAt: item.sentAt ? format.dateTime({ instant: item.sentAt }) : null,
    };
  });
}
