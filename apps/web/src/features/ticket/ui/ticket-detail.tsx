import { getTicket } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { AssignmentSection } from "@/features/assignment/ui/assignment-section";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketData } from "../load-ticket-data";
import { TicketActions } from "./ticket-actions";
import { TicketFacts } from "./ticket-facts";
import { TicketPhaseLabel } from "./ticket-phase-label";
import { TicketSections } from "./ticket-sections";

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
  const abilities = await getCallerAbilities();
  const [ticket, data] = await Promise.all([
    runOperation({ operation: getTicket, input: { id } }),
    loadTicketData(),
  ]);
  if (!ticket.ok) {
    return <ErrorState errorKey={handleLoadError({ error: ticket.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const actions = <TicketActions ticket={ticket.value} data={data.value} abilities={abilities} />;
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
      <TicketSections
        locale={locale}
        ticket={ticket.value}
        phases={data.value.phases}
        abilities={abilities}
      />
    </div>
  );
}
