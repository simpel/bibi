import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadWorkOrderOptions } from "../load-work-order-options";
import { WorkOrderDefinitionWizard } from "./work-order-definition-wizard";

export type WorkOrderDefinitionCreateProps = { locale: Locale };

/** `/new/work-order`: the step-by-step create page. */
export async function WorkOrderDefinitionCreate({ locale }: WorkOrderDefinitionCreateProps) {
  const t = await getTranslations("workOrderDefinition");
  const options = await loadWorkOrderOptions();
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsWorkOrders}
      title={t("create")}
      description={t("createDescription")}
    >
      <WorkOrderDefinitionWizard options={options.value} />
    </FormPageShell>
  );
}
