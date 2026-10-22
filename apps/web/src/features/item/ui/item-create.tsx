import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadItemFormData } from "../load-item-form-data";
import { ItemWizard } from "./item-wizard";

export type ItemCreateProps = { locale: Locale; typeId?: string | undefined };

/** `/new/item`: the step-by-step create page (type, details, setup). */
export async function ItemCreate({ locale, typeId }: ItemCreateProps) {
  const t = await getTranslations("item");
  const data = await loadItemFormData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell backHref={ROUTES.items} title={t("create")} description={t("createDescription")}>
      <ItemWizard data={data.value} typeId={typeId} />
    </FormPageShell>
  );
}
