import { listVocabularies } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateVocabularyButton } from "./create-vocabulary-button";
import { ImportAllergensButton } from "./import-allergens-button";
import { VocabularyTable } from "./vocabulary-table";

type VocabularyListHeaderProps = { canWrite: boolean };

async function VocabularyListHeader({ canWrite }: VocabularyListHeaderProps) {
  const t = await getTranslations("vocabulary");
  const actions = canWrite ? (
    <>
      <ImportAllergensButton />
      <CreateVocabularyButton />
    </>
  ) : undefined;
  return <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />;
}

export type VocabularyListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

/** Lists page body: header with create and the allergen template import, table, pagination. */
export async function VocabularyList({ locale, cursor }: VocabularyListProps) {
  const t = await getTranslations("vocabulary");
  const { configurationWrite } = await getCallerAbilities();
  const result = await runOperation({
    operation: listVocabularies,
    input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  const header = <VocabularyListHeader canWrite={configurationWrite} />;
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const { items, nextCursor } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <>
          <VocabularyTable vocabularies={items} canWrite={configurationWrite} />
          <CursorPagination
            pathname={ROUTES.settingsLists}
            cursor={cursor}
            nextCursor={nextCursor}
          />
        </>
      )}
    </div>
  );
}
