import { getResponsibility } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadResponsibilityOptions } from "../load-responsibility-options";
import { ResponsibilityUpdateForm } from "./responsibility-update-form";

export type ResponsibilityUpdateProps = { locale: Locale; id: string };

/** `/settings/responsibilities/[id]/update`: edit on a page of its own. */
export async function ResponsibilityUpdate({ locale, id }: ResponsibilityUpdateProps) {
  const t = await getTranslations("responsibility");
  const [responsibility, options] = await Promise.all([
    runOperation({ operation: getResponsibility, input: { id } }),
    loadResponsibilityOptions(),
  ]);
  if (!responsibility.ok)
    return <ErrorState errorKey={handleLoadError({ error: responsibility.error, locale })} />;
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <FormPageShell
      backHref={ROUTES.settingsResponsibilities}
      title={t("edit")}
      description={t("editDescription")}
    >
      <ResponsibilityUpdateForm responsibility={responsibility.value} options={options.value} />
    </FormPageShell>
  );
}
