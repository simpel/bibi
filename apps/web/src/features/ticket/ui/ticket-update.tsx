import { getTicket } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ticketRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketData } from "../load-ticket-data";
import { TicketUpdateForm } from "./ticket-update-form";

export type TicketUpdateProps = { locale: Locale; id: string };

/** `/tickets/[id]/update`: edit the ticket on a page of its own. */
export async function TicketUpdate({ locale, id }: TicketUpdateProps) {
  const t = await getTranslations("ticket");
  const [ticket, data] = await Promise.all([
    runOperation({ operation: getTicket, input: { id } }),
    loadTicketData(),
  ]);
  if (!ticket.ok) return <ErrorState errorKey={handleLoadError({ error: ticket.error, locale })} />;
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ticketRoute({ id })}
      title={t("edit")}
      description={t("editDescription")}
    >
      <TicketUpdateForm ticket={ticket.value} data={data.value} />
    </FormPageShell>
  );
}
