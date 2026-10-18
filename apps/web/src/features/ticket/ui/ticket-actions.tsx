import type { TicketDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ticketRoute, updateRoute } from "@/lib/routes";
import { ChangePhaseButton } from "./change-phase-button";
import type { TicketFormData } from "./ticket-form-data";

export type TicketActionsProps = { ticket: TicketDto; data: TicketFormData };

/** Edit (its own page) and change-phase buttons of the ticket detail page. */
export async function TicketActions({ ticket, data }: TicketActionsProps) {
  const t = await getTranslations("ticket");
  return (
    <>
      <Button asChild variant="outline">
        <Link href={updateRoute({ detail: ticketRoute({ id: ticket.id }) })}>
          <PencilIcon />
          {t("edit")}
        </Link>
      </Button>
      <ChangePhaseButton ticket={ticket} phases={data.phases} />
    </>
  );
}
