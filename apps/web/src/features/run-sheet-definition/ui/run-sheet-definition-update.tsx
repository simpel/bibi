import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadRunSheetDefinition } from "@/features/run-sheet-definition/load-run-sheet-definition";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadRunSheetOptions } from "../load-run-sheet-options";
import { RunSheetDefinitionDangerArea } from "./run-sheet-definition-danger-area";
import { RunSheetDefinitionUpdateForm } from "./run-sheet-definition-update-form";

export type RunSheetDefinitionUpdateProps = { locale: Locale; id: string };

/** `/admin/run-sheets/[id]/update`: edit on a page of its own, the danger area last. */
export async function RunSheetDefinitionUpdate({ locale, id }: RunSheetDefinitionUpdateProps) {
  const [t, abilities, runSheet, options] = await Promise.all([
    getTranslations("runSheetDefinition"),
    getCallerAbilities(),
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
      <FormPageShell title={t("edit")} description={t("editDescription")}>
        <RunSheetDefinitionUpdateForm runSheet={runSheet.value} options={options.value} />
      </FormPageShell>
      {can({ abilities, permission: "template:delete" }) ? (
        <RunSheetDefinitionDangerArea runSheet={runSheet.value} />
      ) : null}
    </>
  );
}
