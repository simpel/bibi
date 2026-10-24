import { listTicketStatuses } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { StatusGridEditor } from "@/features/status-grid/ui/status-grid-editor";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateTicketStatusButton } from "./create-ticket-status-button";
import { ImportTicketStatusTemplateButton } from "./import-ticket-status-template-button";
import { TicketStatusTable } from "./ticket-status-table";

export type TicketStatusListProps = { locale: Locale };

/** An organization has a handful of statuses; reordering needs all of them on one page. */
const PAGE_SIZE = 100;

/** Ticket statuses page body: header with admin actions and the ordered table. */
export async function TicketStatusList({ locale }: TicketStatusListProps) {
  const t = await getTranslations("ticketStatus");
  const abilities = await getCallerAbilities();
  const result = await runOperation({
    operation: listTicketStatuses,
    input: { limit: PAGE_SIZE },
  });
  const actions = can({ abilities, permission: "pipeline:write" }) ? (
    <>
      <ImportTicketStatusTemplateButton />
      <CreateTicketStatusButton />
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
  const access = rowAccess({ abilities, feature: "pipeline" });
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={actions} />
      ) : (
        <TicketStatusTable statuses={items} access={access} />
      )}
      <StatusGridEditor locale={locale} />
    </div>
  );
}
