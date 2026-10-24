import { getTicketStatus } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { TicketStatusPageForm } from "./ticket-status-page-form";

export type TicketStatusUpdateProps = { locale: Locale; id: string };

/** `/settings/pipeline/[id]/update`: edit a status on a page of its own. */
export async function TicketStatusUpdate({ locale, id }: TicketStatusUpdateProps) {
  const t = await getTranslations("ticketStatus");
  const ticketStatus = await runOperation({ operation: getTicketStatus, input: { id } });
  if (!ticketStatus.ok)
    return <ErrorState errorKey={handleLoadError({ error: ticketStatus.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsPipeline}
      title={t("edit")}
      description={t("editDescription")}
    >
      <TicketStatusPageForm ticketStatus={ticketStatus.value} />
    </FormPageShell>
  );
}
