import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadItemTypeGroups } from "@/features/item-type-group/load-item-type-groups";
import { ROUTES } from "@/lib/routes";
import { EntityTypeWizard } from "./entity-type-wizard";

export type EntityTypeCreateProps = {
  /** Opened from the item create page (`?for=item`): back and save return there. */
  forItem: boolean;
};

/** `/new/type`: the step-by-step create page; the type's fields are added on its page next. */
export async function EntityTypeCreate({ forItem }: EntityTypeCreateProps) {
  const [t, groups] = await Promise.all([getTranslations("entityType"), loadItemTypeGroups()]);
  return (
    <FormPageShell title={t("create")} description={t("createDescription")}>
      <EntityTypeWizard groups={groups.ok ? groups.value : []} forItem={forItem} />
    </FormPageShell>
  );
}
