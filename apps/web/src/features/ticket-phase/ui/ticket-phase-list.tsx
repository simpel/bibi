import { listTicketPhases } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { PhaseGridEditor } from "@/features/phase-grid/ui/phase-grid-editor";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateTicketPhaseButton } from "./create-ticket-phase-button";
import { ImportTicketPhaseTemplateButton } from "./import-ticket-phase-template-button";
import { TicketPhaseTable } from "./ticket-phase-table";

export type TicketPhaseListProps = { locale: Locale };

/** An organization has a handful of phases; reordering needs all of them on one page. */
const PAGE_SIZE = 100;

/** Ticket phases page body: header with admin actions and the ordered table. */
export async function TicketPhaseList({ locale }: TicketPhaseListProps) {
  const t = await getTranslations("ticketPhase");
  const abilities = await getCallerAbilities();
  const result = await runOperation({
    operation: listTicketPhases,
    input: { limit: PAGE_SIZE },
  });
  const actions = can({ abilities, permission: "pipeline:write" }) ? (
    <>
      <ImportTicketPhaseTemplateButton />
      <CreateTicketPhaseButton />
    </>
  ) : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={actions} />
      ) : (
        <TicketPhaseTable phases={items} access={rowAccess({ abilities, feature: "pipeline" })} />
      )}
      <PhaseGridEditor locale={locale} />
    </div>
  );
}
