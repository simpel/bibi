import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadRunSheetDefinition } from "@/features/run-sheet-definition/load-run-sheet-definition";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadRunSheetOptions } from "../load-run-sheet-options";
import { RunSheetDefinitionUpdateForm } from "./run-sheet-definition-update-form";

export type RunSheetDefinitionUpdateProps = { locale: Locale; id: string };

/** `/admin/run-sheets/[id]/update`: edit on a page of its own. */
export async function RunSheetDefinitionUpdate({ locale, id }: RunSheetDefinitionUpdateProps) {
  const t = await getTranslations("runSheetDefinition");
  const [runSheet, options] = await Promise.all([
    loadRunSheetDefinition({ id }),
    loadRunSheetOptions(),
  ]);
  if (!runSheet.ok)
    return <ErrorState errorKey={handleLoadError({ error: runSheet.error, locale })} />;
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <>
      <CrumbName href={`/admin/run-sheets/${id}/update`} name={runSheet.value.name} />
      <FormPageShell
        backHref={ROUTES.adminRunSheets}
        title={t("edit")}
        description={t("editDescription")}
      >
        <RunSheetDefinitionUpdateForm runSheet={runSheet.value} options={options.value} />
      </FormPageShell>
    </>
  );
}
