import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { TicketPhasePageForm } from "./ticket-phase-page-form";

/** `/new/ticket-phase`: create a phase on a page of its own. */
export async function TicketPhaseCreate() {
  const t = await getTranslations("ticketPhase");
  return (
    <FormPageShell
      backHref={ROUTES.settingsPipeline}
      title={t("create")}
      description={t("createDescription")}
    >
      <TicketPhasePageForm />
    </FormPageShell>
  );
}
