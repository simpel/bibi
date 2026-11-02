import { listWorkOrderDefinitions, type WorkOrderDefinitionDto } from "@bibi/core";
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
import { loadWorkOrderOptions } from "../load-work-order-options";
import { CreateWorkOrderDefinitionButton } from "./create-work-order-definition-button";
import { WorkOrderDefinitionTable } from "./work-order-definition-table";
import type { WorkOrderOptions } from "./work-order-options";

type WorkOrderDefinitionListOutput = { items: WorkOrderDefinitionDto[]; nextCursor: string | null };

export type WorkOrderDefinitionListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

type LoadInput = { cursor?: string | undefined };

/** One page of work orders and the options to name and edit them; the first error wins. */
async function loadPage({ cursor }: LoadInput) {
  const [page, options] = await Promise.all([
    runOperation({
      operation: listWorkOrderDefinitions,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
    loadWorkOrderOptions(),
  ]);
  if (!page.ok) return page;
  if (!options.ok) return options;
  return { ok: true as const, value: { ...page.value, options: options.value } };
}

type WorkOrderDefinitionPageProps = {
  page: WorkOrderDefinitionListOutput & { options: WorkOrderOptions };
  cursor: string | undefined;
  create: ReactNode;
  access: RowAccess;
};

async function WorkOrderDefinitionPage({
  page,
  cursor,
  create,
  access,
}: WorkOrderDefinitionPageProps) {
  const t = await getTranslations("workOrderDefinition");
  if (page.items.length === 0 && !cursor) {
    return <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />;
  }
  return (
    <>
      <WorkOrderDefinitionTable workOrders={page.items} options={page.options} access={access} />
      <CursorPagination
        pathname={ROUTES.settingsWorkOrders}
        cursor={cursor}
        nextCursor={page.nextCursor}
      />
    </>
  );
}

/** Work orders page body: header with create, table, cursor pagination. */
export async function WorkOrderDefinitionList({ locale, cursor }: WorkOrderDefinitionListProps) {
  const t = await getTranslations("workOrderDefinition");
  const abilities = await getCallerAbilities();
  const result = await loadPage({ cursor });
  const options = result.ok ? result.value.options : undefined;
  const create =
    can({ abilities, permission: "template:write" }) && options ? (
      <CreateWorkOrderDefinitionButton />
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
      <WorkOrderDefinitionPage
        page={result.value}
        cursor={cursor}
        create={create}
        access={rowAccess({ abilities, feature: "template" })}
      />
    </div>
  );
}
