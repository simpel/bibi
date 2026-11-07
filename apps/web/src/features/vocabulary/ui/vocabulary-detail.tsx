import type { Locale } from "@bibi/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadVocabulary } from "@/features/vocabulary/load-vocabulary";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { AddValueButton } from "./add-value-button";
import { ValueTable } from "./value-table";
import { VocabularyRowActions } from "./vocabulary-row-actions";

export type VocabularyDetailProps = { locale: Locale; id: string };

/** List detail page: rename/archive the list and manage its values. */
export async function VocabularyDetail({ locale, id }: VocabularyDetailProps) {
  const [t, common, abilities, result] = await Promise.all([
    getTranslations("vocabulary"),
    getTranslations("common"),
    getCallerAbilities(),
    loadVocabulary({ id }),
  ]);
  const access = rowAccess({ abilities, feature: "configuration" });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const vocabulary = result.value;
  const actions = (
    <>
      {access.canEdit || access.canRemove ? (
        <VocabularyRowActions vocabulary={vocabulary} redirectToList access={access} />
      ) : null}
      {can({ abilities, permission: "configuration:write" }) ? (
        <AddValueButton vocabularyId={vocabulary.id} />
      ) : null}
    </>
  );
  return (
    <div className="grid gap-6">
      <CrumbName href={`/admin/lists/${id}`} name={vocabulary.name} />
      <Link
        href={ROUTES.adminLists}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={vocabulary.name} description={t("value.heading")} actions={actions} />
      {vocabulary.values.length === 0 ? (
        <EmptyState title={t("value.empty")} />
      ) : (
        <ValueTable vocabulary={vocabulary} access={access} />
      )}
    </div>
  );
}
