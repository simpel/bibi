import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { TicketStatusPageForm } from "./ticket-status-page-form";

/** `/new/ticket-status`: create a status on a page of its own. */
export async function TicketStatusCreate() {
  const t = await getTranslations("ticketStatus");
  return (
    <FormPageShell
      backHref={ROUTES.settingsPipeline}
      title={t("create")}
      description={t("createDescription")}
    >
      <TicketStatusPageForm />
    </FormPageShell>
  );
}
