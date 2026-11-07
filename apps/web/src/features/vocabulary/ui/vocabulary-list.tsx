import { listVocabularies } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateVocabularyButton } from "./create-vocabulary-button";
import { ImportAllergensButton } from "./import-allergens-button";
import { VocabularyTable } from "./vocabulary-table";

export type VocabularyListProps = { locale: Locale };

const PAGE_SIZE = 100;
const CREATE = "configuration:write";

/** The `lists` section: header with create and the allergen template import, table. */
export async function VocabularyList({ locale }: VocabularyListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("vocabulary"),
    getCallerAbilities(),
    runOperation({ operation: listVocabularies, input: { limit: PAGE_SIZE } }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateVocabularyButton /> : undefined;
  const actions = create && (
    <>
      <ImportAllergensButton />
      {create}
    </>
  );
  const section = {
    section: "lists" as const,
    description: t("listDescription"),
    actions,
  };
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminSection {...section}>
        <ErrorState errorKey={errorKey} inline />
      </AdminSection>
    );
  }
  const { items } = result.value;
  // Nothing to show and nothing the caller may create here: the section stays off the page.
  if (items.length === 0 && !create) return null;
  return (
    <AdminSection {...section}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <VocabularyTable
          vocabularies={items}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </AdminSection>
  );
}
