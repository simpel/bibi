"use client";

import type { TicketStatusDto } from "@bibi/core/schemas";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { TicketStatusForm } from "./ticket-status-form";

export type TicketStatusPageFormProps = { ticketStatus?: TicketStatusDto | undefined };

/** The status form on its create or update page; saving (or cancelling) goes back to the list. */
export function TicketStatusPageForm({ ticketStatus }: TicketStatusPageFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <TicketStatusForm
        ticketStatus={ticketStatus}
        onDone={() => router.push(ROUTES.settingsPipeline)}
      />
    </div>
  );
}
