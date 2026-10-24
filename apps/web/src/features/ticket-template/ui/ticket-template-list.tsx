import { listTicketTemplates } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketTemplateData } from "../load-ticket-template-data";
import { CreateTicketTemplateButton } from "./create-ticket-template-button";
import { TicketTemplateTable } from "./ticket-template-table";

export type TicketTemplateListProps = { locale: Locale };

/** An organization has a handful of predefined tickets: one page, no paging. */
const PAGE_SIZE = 100;
const CREATE = "template:write";

/** Predefined tickets page body: header with the admin action and the table. */
export async function TicketTemplateList({ locale }: TicketTemplateListProps) {
  const t = await getTranslations("ticketTemplate");
  const abilities = await getCallerAbilities();
  const [result, data] = await Promise.all([
    runOperation({ operation: listTicketTemplates, input: { limit: PAGE_SIZE } }),
    loadTicketTemplateData(),
  ]);
  const actions = can({ abilities, permission: CREATE }) && <CreateTicketTemplateButton />;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  const failed = !result.ok ? result : !data.ok ? data : null;
  if (failed) {
    const errorKey = handleLoadError({ error: failed.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  if (!result.ok || !data.ok) return null;
  const { items } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={actions} />
      ) : (
        <TicketTemplateTable
          templates={items}
          statuses={data.value.statuses}
          types={data.value.ticketTypes}
          access={rowAccess({ abilities, feature: "template" })}
        />
      )}
    </div>
  );
}
