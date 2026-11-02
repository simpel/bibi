import type { Permission, TicketDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { AssignmentSection } from "@/features/assignment/ui/assignment-section";
import { TicketMessages } from "@/features/inbound-message/ui/ticket-messages";
import { ProgramSection } from "@/features/line/ui/program-section";
import { TicketPayments } from "@/features/payment/ui/ticket-payments";
import { TicketQuotes } from "@/features/quote/ui/ticket-quotes";
import { RequirementSection } from "@/features/requirement/ui/requirement-section";
import { SheetSection } from "@/features/sheet/ui/sheet-section";
import { type CallerAbilities, can } from "@/server/caller-abilities";
import { TicketEstimateHistory } from "./ticket-estimate-history";
import { TicketDetails } from "./ticket-facts";
import type { TicketFormData } from "./ticket-form-data";
import { TicketStatusHistory } from "./ticket-status-history";

export type TicketSectionsProps = {
  locale: Locale;
  ticket: TicketDto;
  data: TicketFormData;
  abilities: CallerAbilities;
};

/**
 * The ticket page's sections, the daily work first: lines, then money, then the rest of the
 * ticket, and its record (quote versions, status and estimate history) last. Each belongs to
 * another feature (ADR 0050, feature scope): without that feature's `read` the section is left
 * out, not shown as an error.
 */
export function TicketSections({ locale, ticket, data, abilities }: TicketSectionsProps) {
  const allowed = ({ permission }: { permission: Permission }) => can({ abilities, permission });
  const { statuses } = data;
  return (
    <>
      {allowed({ permission: "program:read" }) ? (
        <>
          <ProgramSection locale={locale} ticket={ticket} />
          <RequirementSection locale={locale} ticket={ticket} />
        </>
      ) : null}
      {allowed({ permission: "payment:read" }) ? (
        <TicketPayments
          locale={locale}
          ticketId={ticket.id}
          canRequest={allowed({ permission: "payment:write" })}
        />
      ) : null}
      <TicketDetails ticket={ticket} data={data} />
      <AssignmentSection
        locale={locale}
        subject={{ subjectType: "TICKET", subjectId: ticket.id }}
        members={data.members}
      />
      {allowed({ permission: "sheet:read" }) ? (
        <SheetSection locale={locale} ticket={ticket} />
      ) : null}
      <TicketMessages locale={locale} ticketId={ticket.id} address={ticket.inboundAddress} />
      {allowed({ permission: "quote:read" }) ? (
        <TicketQuotes locale={locale} ticket={ticket} statuses={statuses} />
      ) : null}
      <TicketStatusHistory locale={locale} ticketId={ticket.id} statuses={statuses} />
      <TicketEstimateHistory locale={locale} ticketId={ticket.id} />
    </>
  );
}
