import { getVocabulary } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { AddValueButton } from "./add-value-button";
import { ValueTable } from "./value-table";
import { VocabularyRowActions } from "./vocabulary-row-actions";

export type VocabularyDetailProps = { locale: Locale; id: string };

/** List detail page: rename/archive the list and manage its values. */
export async function VocabularyDetail({ locale, id }: VocabularyDetailProps) {
  const t = await getTranslations("vocabulary");
  const common = await getTranslations("common");
  const { configurationWrite } = await getCallerAbilities();
  const result = await runOperation({ operation: getVocabulary, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const vocabulary = result.value;
  const actions = configurationWrite ? (
    <>
      <VocabularyRowActions vocabulary={vocabulary} redirectToList />
      <AddValueButton vocabularyId={vocabulary.id} />
    </>
  ) : undefined;
  return (
    <div className="grid gap-6">
      <Link
        href={ROUTES.settingsLists}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader title={vocabulary.name} description={t("value.heading")} actions={actions} />
      {vocabulary.values.length === 0 ? (
        <EmptyState title={t("value.empty")} />
      ) : (
        <ValueTable vocabulary={vocabulary} canWrite={configurationWrite} />
      )}
    </div>
  );
}
