import { getEnv } from "@okazi/config";
import type { Ticket } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import { ticketReplyAddress } from "../inbound-email/address";
import { LATEST_PHASE_CHANGE, type LatestPhaseChange } from "./phase-history";
import type { TicketDto } from "./schema";

export type TicketRow = Ticket & WithRecordLinks & LatestPhaseChange;

export type ToTicketDtoInput = { row: TicketRow };

/**
 * Prisma `include` for every ticket read (`toTicketDto`): its `LINK` values and its newest phase
 * change (ADR 0054).
 */
export const TICKET_INCLUDE = { ...WITH_RECORD_LINKS, ...LATEST_PHASE_CHANGE };

export const toTicketDto = ({ row }: ToTicketDtoInput): TicketDto => {
  const { record: _record, phaseChanges, ...ticket } = row;
  const domain = getEnv().MAIL_INBOUND_DOMAIN;
  const inboundAddress = ticketReplyAddress({ ticketId: row.id, domain });
  const latest = phaseChanges[0];
  return {
    ...ticket,
    phaseChangedAt: latest?.changedAt ?? row.createdAt,
    phaseReason: latest?.reason ?? null,
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
