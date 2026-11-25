import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadVocabulary } from "@/features/vocabulary/load-vocabulary";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { AddValueButton } from "./add-value-button";
import { ValueTable } from "./value-table";
import { VocabularyDangerArea } from "./vocabulary-danger-area";
import { VocabularyRowActions } from "./vocabulary-row-actions";

export type VocabularyDetailProps = { locale: Locale; id: string };

/** List detail page: rename the list, manage its values, and its danger area last. */
export async function VocabularyDetail({ locale, id }: VocabularyDetailProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("vocabulary"),
    getCallerAbilities(),
    loadVocabulary({ id }),
  ]);
  const access = rowAccess({ abilities, feature: "configuration" });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const vocabulary = result.value;
  const actions = (
    <>
      {access.canEdit ? <VocabularyRowActions vocabulary={vocabulary} access={access} /> : null}
      {can({ abilities, permission: "configuration:write" }) ? (
        <AddValueButton vocabularyId={vocabulary.id} />
      ) : null}
    </>
  );
  return (
    <div className="grid gap-6">
      <CrumbName href={`/admin/lists/${id}`} name={vocabulary.name} />
      <PageHeader title={vocabulary.name} description={t("value.heading")} actions={actions} />
      {vocabulary.values.length === 0 ? (
        <EmptyState title={t("value.empty")} />
      ) : (
        <ValueTable vocabulary={vocabulary} access={access} />
      )}
      {access.canRemove ? <VocabularyDangerArea vocabulary={vocabulary} /> : null}
    </div>
  );
}
