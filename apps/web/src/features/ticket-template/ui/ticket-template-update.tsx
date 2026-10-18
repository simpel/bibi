import { getTicketTemplate } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketTemplateData } from "../load-ticket-template-data";
import { TicketTemplatePageForm } from "./ticket-template-page-form";

export type TicketTemplateUpdateProps = { locale: Locale; id: string };

/** `/settings/ticket-templates/[id]/update`: edit a predefined ticket on a page of its own. */
export async function TicketTemplateUpdate({ locale, id }: TicketTemplateUpdateProps) {
  const t = await getTranslations("ticketTemplate");
  if (!(await getCallerAbilities()).ticketTemplateAdmin) notFound();
  const [template, data] = await Promise.all([
    runOperation({ operation: getTicketTemplate, input: { id } }),
    loadTicketTemplateData(),
  ]);
  const failed = !template.ok ? template : !data.ok ? data : null;
  if (failed) return <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} />;
  if (!template.ok || !data.ok) return null;
  return (
    <FormPageShell
      backHref={ROUTES.settingsTicketTemplates}
      title={t("edit")}
      description={t("editDescription")}
    >
      <TicketTemplatePageForm data={data.value} template={template.value} />
    </FormPageShell>
  );
}
