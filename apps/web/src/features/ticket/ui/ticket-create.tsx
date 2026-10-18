import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTicketData } from "../load-ticket-data";
import { TicketWizard } from "./ticket-wizard";

export type TicketCreateProps = { locale: Locale };

/** `/new/ticket`: the step-by-step create page. */
export async function TicketCreate({ locale }: TicketCreateProps) {
  const t = await getTranslations("ticket");
  const data = await loadTicketData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.tickets}
      title={t("create")}
      description={t("createDescription")}
    >
      <TicketWizard data={data.value} />
    </FormPageShell>
  );
}
