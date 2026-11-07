import { listVocabularies } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateVocabularyButton } from "./create-vocabulary-button";
import { ImportAllergensButton } from "./import-allergens-button";
import { VocabularyTable } from "./vocabulary-table";

export type VocabularyListProps = {
  locale: Locale /** Accepted for the page's search params; the client view paginates one loaded page. */;
};

const PAGE_SIZE = 100;
const CREATE = "configuration:write";

/** Lists page body: header with create and the allergen template import, table, pagination. */
export async function VocabularyList({ locale }: VocabularyListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("vocabulary"),
    getCallerAbilities(),
    runOperation({
      operation: listVocabularies,
      input: { limit: PAGE_SIZE },
    }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateVocabularyButton /> : undefined;
  const actions = create && (
    <>
      <ImportAllergensButton />
      {create}
    </>
  );
  const header = (
    <AdminHeader title={t("plural")} description={t("listDescription")} actions={actions} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState errorKey={errorKey} />
      </AdminPage>
    );
  }
  const { items } = result.value;
  return (
    <AdminPage header={header}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <VocabularyTable
          vocabularies={items}
          access={rowAccess({ abilities, feature: "configuration" })}
        />
      )}
    </AdminPage>
  );
}
