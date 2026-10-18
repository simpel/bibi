import type { TicketDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { ticketRoute } from "@/lib/routes";

export type TicketReferenceCellProps = {
  ticket: TicketDto;
  reference: string;
};

/** The reference as a link to the ticket. */
export function TicketReferenceCell({ ticket, reference }: TicketReferenceCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Link href={ticketRoute({ id: ticket.id })} className="font-medium hover:underline">
        {reference}
      </Link>
    </div>
  );
}
