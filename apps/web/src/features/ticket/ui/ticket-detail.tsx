import { getTicket, type TicketDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { TicketIssues } from "@/features/line/ui/ticket-issues";
import { ticketName } from "@/lib/ticket-label";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketData } from "../load-ticket-data";
import { TicketActions } from "./ticket-actions";
import { TicketKeyFacts } from "./ticket-facts";
import { TicketSections } from "./ticket-sections";
import { TicketStatusLabel } from "./ticket-status-label";
import { TicketStatusMenu } from "./ticket-status-menu";

type Heading = {
  ticket: TicketDto;
  label: (values: { reference: number }) => string;
  short: (values: { reference: number }) => string;
};

/** The title leads with the number after it; an untitled ticket is headed by its reference. */
function heading({ ticket, label, short }: Heading) {
  const fallback = label({ reference: ticket.reference });
  return ticket.title === null
    ? { title: fallback }
    : {
        title: ticketName({ title: ticket.title, fallback }),
        suffix: short({ reference: ticket.reference }),
      };
}

export type TicketDetailProps = { locale: Locale; id: string };

export async function TicketDetail({ locale, id }: TicketDetailProps) {
  const t = await getTranslations("ticket");
  const sheet = await getTranslations("ticketSheet");
  const label = ({ reference }: { reference: number }) => t("reference", { reference });
  const short = ({ reference }: { reference: number }) => sheet("reference", { reference });
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
        <PageHeader {...heading({ ticket: ticket.value, label, short })} actions={actions} />
        {can({ abilities, permission: "program:read" }) ? <TicketIssues ticketId={id} /> : null}
        <div>
          {can({ abilities, permission: "ticket:write" }) ? (
            <TicketStatusMenu ticket={ticket.value} statuses={statuses} />
          ) : (
            <TicketStatusLabel statuses={statuses} id={ticket.value.statusId} />
          )}
        </div>
        <TicketKeyFacts ticket={ticket.value} data={data.value} />
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
