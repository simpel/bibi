"use client";

import type { TicketDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { ticketRoute } from "@/lib/routes";
import { TicketForm } from "./ticket-form";
import type { TicketFormData } from "./ticket-form-data";

export type TicketUpdateFormProps = { ticket: TicketDto; data: TicketFormData };

/** The ticket form on its update page; saving (or cancelling) goes back to the ticket. */
export function TicketUpdateForm({ ticket, data }: TicketUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <TicketForm
        data={data}
        ticket={ticket}
        onDone={() => router.push(ticketRoute({ id: ticket.id }))}
      />
    </div>
  );
}
