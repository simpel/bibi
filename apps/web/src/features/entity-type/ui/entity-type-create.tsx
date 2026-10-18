import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { EntityTypeWizard } from "./entity-type-wizard";

/** `/new/type`: the step-by-step create page; the type's fields are added on its page next. */
export async function EntityTypeCreate() {
  const t = await getTranslations("entityType");
  return (
    <FormPageShell
      backHref={ROUTES.settingsTypes}
      title={t("create")}
      description={t("createDescription")}
    >
      <EntityTypeWizard />
    </FormPageShell>
  );
}
