import type { Permission, TicketDto, TicketPhaseDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { TicketInbox } from "@/features/inbound-email/ui/ticket-inbox";
import { TicketPayments } from "@/features/payment/ui/ticket-payments";
import { ProgramSection } from "@/features/program-item/ui/program-section";
import { TicketQuotes } from "@/features/quote/ui/ticket-quotes";
import { RequirementSection } from "@/features/requirement/ui/requirement-section";
import { SheetSection } from "@/features/sheet/ui/sheet-section";
import { type CallerAbilities, can } from "@/server/caller-abilities";

export type TicketSectionsProps = {
  locale: Locale;
  ticket: TicketDto;
  phases: readonly TicketPhaseDto[];
  abilities: CallerAbilities;
};

/**
 * The ticket page's sections. Each belongs to another feature (ADR 0050, feature scope): without
 * that feature's `view` the section is left out, not shown as an error.
 */
export function TicketSections({ locale, ticket, phases, abilities }: TicketSectionsProps) {
  const allowed = ({ permission }: { permission: Permission }) => can({ abilities, permission });
  return (
    <>
      {allowed({ permission: "quote:read" }) ? (
        <TicketQuotes locale={locale} ticket={ticket} phases={phases} />
      ) : null}
      {allowed({ permission: "payment:read" }) ? (
        <TicketPayments
          locale={locale}
          ticketId={ticket.id}
          canRequest={allowed({ permission: "payment:write" })}
        />
      ) : null}
      {allowed({ permission: "program:read" }) ? (
        <>
          <ProgramSection locale={locale} ticket={ticket} />
          <RequirementSection locale={locale} ticket={ticket} />
        </>
      ) : null}
      {allowed({ permission: "sheet:read" }) ? (
        <SheetSection locale={locale} ticket={ticket} />
      ) : null}
      <TicketInbox locale={locale} ticketId={ticket.id} address={ticket.inboundAddress} />
    </>
  );
}
