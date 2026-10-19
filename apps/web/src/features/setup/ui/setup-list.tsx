import { listSetups } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateSetupButton } from "./create-setup-button";
import { SetupTable } from "./setup-table";

export type SetupListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 50;
const CREATE = "configuration:create";

/** Setups page body: header with create, table, cursor pagination. */
export async function SetupList({ locale, cursor }: SetupListProps) {
  const t = await getTranslations("setup");
  const abilities = await getCallerAbilities();
  const result = await runOperation({
    operation: listSetups,
    input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  const create = can({ abilities, permission: CREATE }) ? <CreateSetupButton /> : undefined;
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
  const { items, nextCursor } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <>
          <SetupTable setups={items} access={rowAccess({ abilities, feature: "configuration" })} />
          <CursorPagination
            pathname={ROUTES.settingsSetups}
            cursor={cursor}
            nextCursor={nextCursor}
          />
        </>
      )}
    </div>
  );
}
