import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadSheetOptions } from "../load-sheet-options";
import { SheetDefinitionWizard } from "./sheet-definition-wizard";

export type SheetDefinitionCreateProps = { locale: Locale };

/** `/new/sheet`: the step-by-step create page. */
export async function SheetDefinitionCreate({ locale }: SheetDefinitionCreateProps) {
  const t = await getTranslations("sheetDefinition");
  const options = await loadSheetOptions();
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsSheets}
      title={t("create")}
      description={t("createDescription")}
    >
      <SheetDefinitionWizard options={options.value} />
    </FormPageShell>
  );
}
