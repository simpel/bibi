import { getTicket } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { TicketIssues } from "@/features/line/ui/ticket-issues";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketData } from "../load-ticket-data";
import { TicketActions } from "./ticket-actions";
import { TicketKeyFacts } from "./ticket-facts";
import { TicketSections } from "./ticket-sections";
import { TicketStatusLabel } from "./ticket-status-label";
import { TicketStatusMenu } from "./ticket-status-menu";

export type TicketDetailProps = { locale: Locale; id: string };

export async function TicketDetail({ locale, id }: TicketDetailProps) {
  const t = await getTranslations("ticket");
  const abilities = await getCallerAbilities();
  const [ticket, data] = await Promise.all([
    runOperation({ operation: getTicket, input: { id } }),
    loadTicketData(),
  ]);
  if (!ticket.ok) {
    return <ErrorState errorKey={handleLoadError({ error: ticket.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const actions = <TicketActions ticket={ticket.value} abilities={abilities} />;
  const statuses = data.value.statuses;
  return (
    // One shrinkable column: a wide table scrolls inside the page instead of widening it.
    <div className="grid grid-cols-1 gap-12">
      <div className="grid grid-cols-1 gap-4">
        <PageHeader
          title={t("reference", { reference: ticket.value.reference })}
          actions={actions}
        />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {can({ abilities, permission: "ticket:write" }) ? (
            <TicketStatusMenu ticket={ticket.value} statuses={statuses} />
          ) : (
            <TicketStatusLabel statuses={statuses} id={ticket.value.statusId} />
          )}
          <TicketKeyFacts ticket={ticket.value} data={data.value} />
        </div>
        {can({ abilities, permission: "program:read" }) ? <TicketIssues ticketId={id} /> : null}
      </div>
      <TicketSections
        locale={locale}
        ticket={ticket.value}
        data={data.value}
        abilities={abilities}
      />
    </div>
  );
}
