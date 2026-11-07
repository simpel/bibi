import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadRunSheetOptions } from "../load-run-sheet-options";
import { RunSheetDefinitionWizard } from "./run-sheet-definition-wizard";

export type RunSheetDefinitionCreateProps = { locale: Locale };

/** `/new/run-sheet`: the step-by-step create page. */
export async function RunSheetDefinitionCreate({ locale }: RunSheetDefinitionCreateProps) {
  const [t, options] = await Promise.all([
    getTranslations("runSheetDefinition"),
    loadRunSheetOptions(),
  ]);
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.adminRunSheets}
      title={t("create")}
      description={t("createDescription")}
    >
      <RunSheetDefinitionWizard options={options.value} />
    </FormPageShell>
  );
}
