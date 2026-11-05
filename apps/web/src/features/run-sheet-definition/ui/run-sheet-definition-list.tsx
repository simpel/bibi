import { listRunSheetDefinitions, type RunSheetDefinitionDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import type { RowAccess } from "@/lib/can";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadRunSheetOptions } from "../load-run-sheet-options";
import { CreateRunSheetDefinitionButton } from "./create-run-sheet-definition-button";
import { RunSheetDefinitionTable } from "./run-sheet-definition-table";
import type { RunSheetOptions } from "./run-sheet-options";

type RunSheetDefinitionListOutput = { items: RunSheetDefinitionDto[]; nextCursor: string | null };

export type RunSheetDefinitionListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

type LoadInput = { cursor?: string | undefined };

/** One page of run sheets and the options to name and edit them; the first error wins. */
async function loadPage({ cursor }: LoadInput) {
  const [page, options] = await Promise.all([
    runOperation({
      operation: listRunSheetDefinitions,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
    loadRunSheetOptions(),
  ]);
  if (!page.ok) return page;
  if (!options.ok) return options;
  return { ok: true as const, value: { ...page.value, options: options.value } };
}

type RunSheetDefinitionPageProps = {
  page: RunSheetDefinitionListOutput & { options: RunSheetOptions };
  cursor: string | undefined;
  create: ReactNode;
  access: RowAccess;
};

async function RunSheetDefinitionPage({
  page,
  cursor,
  create,
  access,
}: RunSheetDefinitionPageProps) {
  const t = await getTranslations("runSheetDefinition");
  if (page.items.length === 0 && !cursor) {
    return <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />;
  }
  return (
    <>
      <RunSheetDefinitionTable runSheets={page.items} options={page.options} access={access} />
      <CursorPagination
        pathname={ROUTES.settingsRunSheets}
        cursor={cursor}
        nextCursor={page.nextCursor}
      />
    </>
  );
}

/** Run sheets page body: header with create, table, cursor pagination. */
export async function RunSheetDefinitionList({ locale, cursor }: RunSheetDefinitionListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("runSheetDefinition"),
    getCallerAbilities(),
    loadPage({ cursor }),
  ]);
  const options = result.ok ? result.value.options : undefined;
  const create =
    can({ abilities, permission: "template:write" }) && options ? (
      <CreateRunSheetDefinitionButton />
    ) : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {header}
      <RunSheetDefinitionPage
        page={result.value}
        cursor={cursor}
        create={create}
        access={rowAccess({ abilities, feature: "template" })}
      />
    </div>
  );
}
