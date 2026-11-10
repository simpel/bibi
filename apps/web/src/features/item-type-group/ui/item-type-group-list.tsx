import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadItemTypeGroups } from "../load-item-type-groups";
import { CreateItemTypeGroupButton } from "./create-item-type-group-button";
import { ItemTypeGroupTable } from "./item-type-group-table";

export type ItemTypeGroupListProps = { locale: Locale };

/** The `groups` section: the headings item types are browsed under, in their order. */
export async function ItemTypeGroupList({ locale }: ItemTypeGroupListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("itemTypeGroup"),
    getCallerAbilities(),
    loadItemTypeGroups(),
  ]);
  const create = can({ abilities, permission: "configuration:write" }) ? (
    <CreateItemTypeGroupButton />
  ) : undefined;
  const section = {
    section: "groups" as const,
    description: t("listDescription"),
    actions: create,
  };
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminSection {...section}>
        <ErrorState errorKey={errorKey} inline />
      </AdminSection>
    );
  }
  const groups = result.value;
  if (groups.length === 0 && !create) return null;
  return (
    <AdminSection {...section}>
      {groups.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <ItemTypeGroupTable
          groups={groups}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </AdminSection>
  );
}
