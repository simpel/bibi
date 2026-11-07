import { listRunSheetDefinitions } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadRunSheetOptions } from "../load-run-sheet-options";
import { CreateRunSheetDefinitionButton } from "./create-run-sheet-definition-button";
import { RunSheetDefinitionTable } from "./run-sheet-definition-table";

export type RunSheetDefinitionListProps = { locale: Locale; inTab?: boolean };

/** An organization has a handful of these: one page of up to 100, paged in the client. */
const PAGE_SIZE = 100;

/** Run sheets page body: header with create, search, table. */
export async function RunSheetDefinitionList({
  locale,
  inTab = false,
}: RunSheetDefinitionListProps) {
  const [t, abilities, page, options] = await Promise.all([
    getTranslations("runSheetDefinition"),
    getCallerAbilities(),
    runOperation({ operation: listRunSheetDefinitions, input: { limit: PAGE_SIZE } }),
    loadRunSheetOptions(),
  ]);
  const create = can({ abilities, permission: "template:write" }) ? (
    <CreateRunSheetDefinitionButton />
  ) : undefined;
  const header = (
    <AdminHeader
      title={t("plural")}
      description={t("listDescription")}
      actions={create}
      inTab={inTab}
    />
  );
  const failed = !page.ok ? page : !options.ok ? options : null;
  if (failed) {
    const errorKey = handleLoadError({ error: failed.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState errorKey={errorKey} inline={inTab} />
      </AdminPage>
    );
  }
  if (!page.ok || !options.ok) return null;
  return (
    <AdminPage header={header}>
      {page.value.items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <RunSheetDefinitionTable
          runSheets={page.value.items}
          options={options.value}
          access={rowAccess({ abilities, feature: "template" })}
        />
      )}
    </AdminPage>
  );
}
