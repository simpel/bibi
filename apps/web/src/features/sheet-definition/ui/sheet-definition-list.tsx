import { listSheetDefinitions, type SheetDefinitionDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadSheetOptions } from "../load-sheet-options";
import { CreateSheetDefinitionButton } from "./create-sheet-definition-button";
import { SheetDefinitionTable } from "./sheet-definition-table";
import type { SheetOptions } from "./sheet-options";

type SheetDefinitionListOutput = { items: SheetDefinitionDto[]; nextCursor: string | null };

export type SheetDefinitionListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

type LoadInput = { cursor?: string | undefined };

/** One page of sheets and the options to name and edit them; the first error wins. */
async function loadPage({ cursor }: LoadInput) {
  const [page, options] = await Promise.all([
    runOperation({
      operation: listSheetDefinitions,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
    loadSheetOptions(),
  ]);
  if (!page.ok) return page;
  if (!options.ok) return options;
  return { ok: true as const, value: { ...page.value, options: options.value } };
}

type SheetDefinitionPageProps = {
  page: SheetDefinitionListOutput & { options: SheetOptions };
  cursor: string | undefined;
  create: ReactNode;
  canWrite: boolean;
};

async function SheetDefinitionPage({ page, cursor, create, canWrite }: SheetDefinitionPageProps) {
  const t = await getTranslations("sheetDefinition");
  if (page.items.length === 0 && !cursor) {
    return <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />;
  }
  return (
    <>
      <SheetDefinitionTable sheets={page.items} options={page.options} canWrite={canWrite} />
      <CursorPagination
        pathname={ROUTES.settingsSheets}
        cursor={cursor}
        nextCursor={page.nextCursor}
      />
    </>
  );
}

/** Sheets page body: header with create, table, cursor pagination. */
export async function SheetDefinitionList({ locale, cursor }: SheetDefinitionListProps) {
  const t = await getTranslations("sheetDefinition");
  const { configurationWrite } = await getCallerAbilities();
  const result = await loadPage({ cursor });
  const options = result.ok ? result.value.options : undefined;
  const create =
    configurationWrite && options ? <CreateSheetDefinitionButton options={options} /> : undefined;
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
      <SheetDefinitionPage
        page={result.value}
        cursor={cursor}
        create={create}
        canWrite={configurationWrite}
      />
    </div>
  );
}
