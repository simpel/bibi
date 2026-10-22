import type { TicketDto } from "@bibi/core";
import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ticketRoute, updateRoute } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { ChangePhaseButton } from "./change-phase-button";
import { ExportTicketButton } from "./export-ticket-button";
import type { TicketFormData } from "./ticket-form-data";

export type TicketActionsProps = {
  ticket: TicketDto;
  data: TicketFormData;
  abilities: CallerAbilities;
};

/** Export, edit (own page) and change-phase buttons of the ticket page, each by its permission. */
export async function TicketActions({ ticket, data, abilities }: TicketActionsProps) {
  const t = await getTranslations("ticket");
  return (
    <>
      {can({ abilities, permission: "ticket:write" }) ? (
        <ExportTicketButton id={ticket.id} />
      ) : null}
      {can({ abilities, permission: "ticket:write" }) ? (
        <Button asChild variant="outline">
          <Link href={updateRoute({ detail: ticketRoute({ id: ticket.id }) })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </Button>
      ) : null}
      {can({ abilities, permission: "ticket:write" }) ? (
        <ChangePhaseButton ticket={ticket} phases={data.phases} />
      ) : null}
    </>
  );
}
