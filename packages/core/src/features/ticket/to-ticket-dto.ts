import { getEnv } from "@okazi/config";
import type { Ticket } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import { ticketReplyAddress } from "../inbound-email/address";
import type { TicketDto } from "./schema";

export type ToTicketDtoInput = { row: Ticket };

export const toTicketDto = ({ row }: ToTicketDtoInput): TicketDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
  inboundAddress: ticketReplyAddress({ ticketId: row.id, domain: getEnv().MAIL_INBOUND_DOMAIN }),
});

export type LoadTicketInput = { context: Pick<OperationContext, "db">; id: string };

/** The active ticket, or null when missing, archived or in another organization. */
export async function loadTicket({ context, id }: LoadTicketInput): Promise<TicketDto | null> {
  const row = await context.db.ticket.findFirst({ where: { id } });
  return row ? toTicketDto({ row }) : null;
}
