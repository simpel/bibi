import type { TicketStatusDto } from "@bibi/core/schemas";
import { STATUS_FLAGS, type StatusFlag } from "@bibi/core/schemas";

/** One table row: a status with the names it may move to and the flags it has. */
export type StatusRow = {
  ticketStatus: TicketStatusDto;
  index: number;
  targets: string[];
  flags: StatusFlag[];
};

export type ToStatusRowsInput = { statuses: readonly TicketStatusDto[] };

/** Rows in board order; unknown transition targets fall back to the id. */
export function toStatusRows({ statuses }: ToStatusRowsInput): StatusRow[] {
  return statuses.map((ticketStatus, index) => ({
    ticketStatus,
    index,
    targets: ticketStatus.transitionsTo.map(
      (id) => statuses.find((target) => target.id === id)?.name ?? id,
    ),
    flags: STATUS_FLAGS.filter((flag) => ticketStatus[flag]),
  }));
}
