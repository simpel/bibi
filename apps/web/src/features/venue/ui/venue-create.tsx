import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { VenueWizard } from "./venue-wizard";

/** `/new/venue`: the step-by-step create page. */
export async function VenueCreate() {
  const t = await getTranslations("venue");
  return (
    <FormPageShell
      backHref={ROUTES.venues}
      title={t("create")}
      description={t("createDescription")}
    >
      <VenueWizard />
    </FormPageShell>
  );
}
