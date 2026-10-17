import { listResponsibilities, type ResponsibilityDto } from "@okazi/core";
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
import { loadResponsibilityOptions } from "../load-responsibility-options";
import { CreateResponsibilityButton } from "./create-responsibility-button";
import type { ResponsibilityOptions } from "./responsibility-options";
import { ResponsibilityTable } from "./responsibility-table";

type ResponsibilityListOutput = { items: ResponsibilityDto[]; nextCursor: string | null };

export type ResponsibilityListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

type LoadInput = { cursor?: string | undefined };

/** One page of responsibilities and the options to name and edit them; the first error wins. */
async function loadPage({ cursor }: LoadInput) {
  const [page, options] = await Promise.all([
    runOperation({
      operation: listResponsibilities,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
    loadResponsibilityOptions(),
  ]);
  if (!page.ok) return page;
  if (!options.ok) return options;
  return { ok: true as const, value: { ...page.value, options: options.value } };
}

type ResponsibilityPageProps = {
  page: ResponsibilityListOutput & { options: ResponsibilityOptions };
  cursor: string | undefined;
  create: ReactNode;
  canWrite: boolean;
};

async function ResponsibilityPage({ page, cursor, create, canWrite }: ResponsibilityPageProps) {
  const t = await getTranslations("responsibility");
  if (page.items.length === 0 && !cursor) {
    return <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />;
  }
  return (
    <>
      <ResponsibilityTable
        responsibilities={page.items}
        options={page.options}
        canWrite={canWrite}
      />
      <CursorPagination
        pathname={ROUTES.settingsResponsibilities}
        cursor={cursor}
        nextCursor={page.nextCursor}
      />
    </>
  );
}

/** Responsibilities page body: header with create, table, cursor pagination. */
export async function ResponsibilityList({ locale, cursor }: ResponsibilityListProps) {
  const t = await getTranslations("responsibility");
  const { configurationWrite } = await getCallerAbilities();
  const result = await loadPage({ cursor });
  const options = result.ok ? result.value.options : undefined;
  const create =
    configurationWrite && options ? <CreateResponsibilityButton options={options} /> : undefined;
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
      <ResponsibilityPage
        page={result.value}
        cursor={cursor}
        create={create}
        canWrite={configurationWrite}
      />
    </div>
  );
}
