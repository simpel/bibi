import { getTicket } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { AssignmentSection } from "@/features/assignment/ui/assignment-section";
import { TicketInbox } from "@/features/inbound-email/ui/ticket-inbox";
import { ProgramSection } from "@/features/line/ui/program-section";
import { TicketPayments } from "@/features/payment/ui/ticket-payments";
import { TicketQuotes } from "@/features/quote/ui/ticket-quotes";
import { RequirementSection } from "@/features/requirement/ui/requirement-section";
import { SheetSection } from "@/features/sheet/ui/sheet-section";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketData } from "../load-ticket-data";
import { ExportTicketButton } from "./export-ticket-button";
import { TicketActions } from "./ticket-actions";
import { TicketFacts } from "./ticket-facts";
import { TicketPhaseHistory } from "./ticket-phase-history";
import { TicketPhaseLabel } from "./ticket-phase-label";

export type TicketDetailProps = { locale: Locale; id: string };

async function BackLink() {
  const common = await getTranslations("common");
  return (
    <Link
      href={ROUTES.tickets}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      {common("back")}
    </Link>
  );
}

export async function TicketDetail({ locale, id }: TicketDetailProps) {
  const t = await getTranslations("ticket");
  const { ticketWrite, paymentWrite } = await getCallerAbilities();
  const [ticket, data] = await Promise.all([
    runOperation({ operation: getTicket, input: { id } }),
    loadTicketData(),
  ]);
  if (!ticket.ok) {
    return <ErrorState errorKey={handleLoadError({ error: ticket.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const actions = (
    <>
      <ExportTicketButton id={id} />
      {ticketWrite ? <TicketActions ticket={ticket.value} data={data.value} /> : null}
    </>
  );
  return (
    <div className="grid gap-6">
      <BackLink />
      <PageHeader title={t("reference", { reference: ticket.value.reference })} actions={actions} />
      <div>
        <TicketPhaseLabel phases={data.value.phases} id={ticket.value.phaseId} />
      </div>
      <TicketFacts ticket={ticket.value} data={data.value} />
      <AssignmentSection
        locale={locale}
        subject={{ subjectType: "TICKET", subjectId: id }}
        members={data.value.members}
      />
      <TicketQuotes locale={locale} ticket={ticket.value} phases={data.value.phases} />
      <TicketPhaseHistory locale={locale} ticketId={id} phases={data.value.phases} />
      <TicketPayments locale={locale} ticketId={id} canRequest={paymentWrite} />
      <ProgramSection locale={locale} ticket={ticket.value} />
      <RequirementSection locale={locale} ticket={ticket.value} />
      <SheetSection locale={locale} ticket={ticket.value} />
      <TicketInbox locale={locale} ticketId={id} address={ticket.value.inboundAddress} />
    </div>
  );
}
