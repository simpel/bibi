import { getEnv } from "@bibi/config";
import type { Ticket } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import {
  RECORD_LINKS_SELECT,
  recordFields,
  type WithRecordLinks,
} from "../../records/record-links";
import { ticketReplyAddress } from "../inbound-email/address";
import { LATEST_ESTIMATE, type LatestEstimate } from "./estimate-history";
import type { TicketDto } from "./schema";
import { LATEST_STATUS_CHANGE, type LatestStatusChange } from "./status-history";

type MainAssignment = { record: { assignments: { assigneeId: string | null }[] } };

export type TicketRow = Ticket &
  WithRecordLinks &
  MainAssignment &
  LatestStatusChange &
  LatestEstimate;

export type ToTicketDtoInput = { row: TicketRow };

/** The record's main assignment (responsibility null), for `assigneeId` (ADR 0055). */
const MAIN_ASSIGNMENT = {
  where: { responsibilityId: null, status: "ACTIVE" },
  select: { assigneeId: true },
  take: 1,
} as const;

/**
 * Prisma `include` for every ticket read (`toTicketDto`): its `LINK` values and main assignee, its
 * newest status change (ADR 0054) and its newest estimate (ADR 0074).
 */
export const TICKET_INCLUDE = {
  record: { select: { ...RECORD_LINKS_SELECT, assignments: MAIN_ASSIGNMENT } },
  ...LATEST_STATUS_CHANGE,
  ...LATEST_ESTIMATE,
};

export const toTicketDto = ({ row }: ToTicketDtoInput): TicketDto => {
  const { record: _record, statusChanges, estimates, ...ticket } = row;
  const domain = getEnv().MAIL_INBOUND_DOMAIN;
  const inboundAddress = ticketReplyAddress({ ticketId: row.id, domain });
  const latest = statusChanges[0];
  return {
    ...ticket,
    assigneeId: row.record.assignments[0]?.assigneeId ?? null,
    statusChangedAt: latest?.changedAt ?? row.createdAt,
    statusReason: latest?.reason ?? null,
    estimatedValueMinor: estimates[0]?.valueMinor ?? null,
    fields: recordFields({ row }),
    inboundAddress,
  };
};

export type LoadTicketInput = { context: Pick<OperationContext, "db">; id: string };

/** The active ticket, or null when missing, archived or in another organization. */
export async function loadTicket({ context, id }: LoadTicketInput): Promise<TicketDto | null> {
  const row = await context.db.ticket.findFirst({ where: { id }, include: TICKET_INCLUDE });
  return row ? toTicketDto({ row }) : null;
}
