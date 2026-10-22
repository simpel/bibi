import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTemplateTicketData } from "../load-template-ticket-data";
import { loadTicketData } from "../load-ticket-data";
import { TemplateTicketForm } from "./template-ticket-form";
import { TicketWizard } from "./ticket-wizard";

export type TicketCreateProps = { locale: Locale; custom: boolean };

/**
 * `/new/ticket`: the short form from a predefined ticket when the organization has any (ADR
 * 0043), otherwise, or with `?mode=custom`, the step-by-step create page.
 */
export async function TicketCreate({ locale, custom }: TicketCreateProps) {
  const t = await getTranslations("ticket");
  const templates = await loadTemplateTicketData();
  const shortForm = templates.ok && templates.value.templates.length > 0 && !custom;
  const header = { backHref: ROUTES.tickets, title: t("create") };
  if (shortForm) {
    return (
      <FormPageShell {...header} description={t("createFromTemplateDescription")}>
        <TemplateTicketForm data={templates.value} />
      </FormPageShell>
    );
  }
  const data = await loadTicketData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell {...header} description={t("createDescription")}>
      {templates.ok && templates.value.templates.length > 0 ? (
        <Link href={ROUTES.ticketNew} className="text-sm text-primary hover:underline">
          {t("useTemplate")}
        </Link>
      ) : null}
      <TicketWizard data={data.value} />
    </FormPageShell>
  );
}
