import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTicketTemplateData } from "../load-ticket-template-data";
import { TicketTemplatePageForm } from "./ticket-template-page-form";

export type TicketTemplateCreateProps = { locale: Locale };

/** `/new/ticket-template`: create a predefined ticket on a page of its own. */
export async function TicketTemplateCreate({ locale }: TicketTemplateCreateProps) {
  const t = await getTranslations("ticketTemplate");
  const data = await loadTicketTemplateData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsTicketTemplates}
      title={t("create")}
      description={t("createDescription")}
    >
      <TicketTemplatePageForm data={data.value} />
    </FormPageShell>
  );
}
