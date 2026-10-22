import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadResponsibilityOptions } from "../load-responsibility-options";
import { ResponsibilityWizard } from "./responsibility-wizard";

export type ResponsibilityCreateProps = { locale: Locale };

/** `/new/responsibility`: the step-by-step create page. */
export async function ResponsibilityCreate({ locale }: ResponsibilityCreateProps) {
  const t = await getTranslations("responsibility");
  const options = await loadResponsibilityOptions();
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsResponsibilities}
      title={t("create")}
      description={t("createDescription")}
    >
      <ResponsibilityWizard options={options.value} />
    </FormPageShell>
  );
}
