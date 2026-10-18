import { getTicketPhase } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { TicketPhasePageForm } from "./ticket-phase-page-form";

export type TicketPhaseUpdateProps = { locale: Locale; id: string };

/** `/settings/pipeline/[id]/update`: edit a phase on a page of its own. */
export async function TicketPhaseUpdate({ locale, id }: TicketPhaseUpdateProps) {
  const t = await getTranslations("ticketPhase");
  if (!(await getCallerAbilities()).ticketPhaseAdmin) notFound();
  const phase = await runOperation({ operation: getTicketPhase, input: { id } });
  if (!phase.ok) return <ErrorState errorKey={handleLoadError({ error: phase.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsPipeline}
      title={t("edit")}
      description={t("editDescription")}
    >
      <TicketPhasePageForm phase={phase.value} />
    </FormPageShell>
  );
}
