import { getEnv } from "@okazi/config";
import type { Ticket } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import { ticketReplyAddress } from "../inbound-email/address";
import type { TicketDto } from "./schema";

export type TicketRow = Ticket & WithRecordLinks;

export type ToTicketDtoInput = { row: TicketRow };

/** Prisma `include` for every ticket read (`toTicketDto`): its `LINK` values. */
export const TICKET_INCLUDE = WITH_RECORD_LINKS;

export const toTicketDto = ({ row }: ToTicketDtoInput): TicketDto => {
  const { record: _record, ...ticket } = row;
  const domain = getEnv().MAIL_INBOUND_DOMAIN;
  const inboundAddress = ticketReplyAddress({ ticketId: row.id, domain });
  return { ...ticket, fields: recordFields({ row }), inboundAddress };
};

export type LoadTicketInput = { context: Pick<OperationContext, "db">; id: string };

/** The active ticket, or null when missing, archived or in another organization. */
export async function loadTicket({ context, id }: LoadTicketInput): Promise<TicketDto | null> {
  const row = await context.db.ticket.findFirst({ where: { id }, include: TICKET_INCLUDE });
  return row ? toTicketDto({ row }) : null;
}
