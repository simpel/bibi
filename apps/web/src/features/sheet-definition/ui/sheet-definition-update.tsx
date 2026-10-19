import { getSheetDefinition } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadSheetOptions } from "../load-sheet-options";
import { SheetDefinitionUpdateForm } from "./sheet-definition-update-form";

export type SheetDefinitionUpdateProps = { locale: Locale; id: string };

/** `/settings/sheets/[id]/update`: edit on a page of its own. */
export async function SheetDefinitionUpdate({ locale, id }: SheetDefinitionUpdateProps) {
  const t = await getTranslations("sheetDefinition");
  const [sheet, options] = await Promise.all([
    runOperation({ operation: getSheetDefinition, input: { id } }),
    loadSheetOptions(),
  ]);
  if (!sheet.ok) return <ErrorState errorKey={handleLoadError({ error: sheet.error, locale })} />;
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsSheets}
      title={t("edit")}
      description={t("editDescription")}
    >
      <SheetDefinitionUpdateForm sheet={sheet.value} options={options.value} />
    </FormPageShell>
  );
}
