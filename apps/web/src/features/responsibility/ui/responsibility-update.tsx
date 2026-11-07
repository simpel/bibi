import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadResponsibility } from "@/features/responsibility/load-responsibility";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadResponsibilityOptions } from "../load-responsibility-options";
import { ResponsibilityUpdateForm } from "./responsibility-update-form";

export type ResponsibilityUpdateProps = { locale: Locale; id: string };

/** `/admin/responsibilities/[id]/update`: edit on a page of its own. */
export async function ResponsibilityUpdate({ locale, id }: ResponsibilityUpdateProps) {
  const t = await getTranslations("responsibility");
  const [responsibility, options] = await Promise.all([
    loadResponsibility({ id }),
    loadResponsibilityOptions(),
  ]);
  if (!responsibility.ok)
    return <ErrorState errorKey={handleLoadError({ error: responsibility.error, locale })} />;
  if (!options.ok)
    return <ErrorState errorKey={handleLoadError({ error: options.error, locale })} />;
  return (
    <>
      <CrumbName href={`/admin/responsibilities/${id}/update`} name={responsibility.value.name} />
      <FormPageShell
        backHref={ROUTES.adminResponsibilities}
        title={t("edit")}
        description={t("editDescription")}
      >
        <ResponsibilityUpdateForm responsibility={responsibility.value} options={options.value} />
      </FormPageShell>
    </>
  );
}
