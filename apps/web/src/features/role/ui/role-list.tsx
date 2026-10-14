import { listRoles } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateRoleButton } from "./create-role-button";
import { ImportRoleTemplateButton } from "./import-role-template-button";
import { RoleTable } from "./role-table";

export type RoleListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;

/** Roles page body: header with admin actions, table, cursor pagination. */
export async function RoleList({ locale, cursor }: RoleListProps) {
  const t = await getTranslations("role");
  const { roleAdmin } = await getCallerAbilities();
  const result = await runOperation({
    operation: listRoles,
    input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  const actions = roleAdmin ? (
    <>
      <ImportRoleTemplateButton />
      <CreateRoleButton />
    </>
  ) : undefined;
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
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
      <RoleTable roles={result.value.items} canAdmin={roleAdmin} />
      <CursorPagination
        pathname={ROUTES.settingsRoles}
        cursor={cursor}
        nextCursor={result.value.nextCursor}
      />
    </div>
  );
}
