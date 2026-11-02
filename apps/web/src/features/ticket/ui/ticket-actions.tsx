import type { TicketDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ticketRoute, updateRoute } from "@/lib/routes";
import { type CallerAbilities, can } from "@/server/caller-abilities";

export type TicketActionsProps = {
  ticket: TicketDto;
  abilities: CallerAbilities;
};

/** The edit button (own page) of the ticket page, each by its permission. */
export async function TicketActions({ ticket, abilities }: TicketActionsProps) {
  const t = await getTranslations("ticket");
  return (
    <>
      {can({ abilities, permission: "ticket:write" }) ? (
        <Button asChild>
          <Link href={updateRoute({ detail: ticketRoute({ id: ticket.id }) })}>
            <PencilIcon />
            {t("edit")}
          </Link>
        </Button>
      ) : null}
    </>
  );
}
