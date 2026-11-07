import { listSetups } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateSetupButton } from "./create-setup-button";
import { SetupTable } from "./setup-table";

export type SetupListProps = {
  locale: Locale;
  /** Accepted for the page's search params; the client view paginates one loaded page. */
  inTab?: boolean;
};

const PAGE_SIZE = 100;
const CREATE = "configuration:write";

/** Setups page body: header with create and one table with search and pagination. */
export async function SetupList({ locale, inTab = false }: SetupListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("setup"),
    getCallerAbilities(),
    runOperation({ operation: listSetups, input: { limit: PAGE_SIZE } }),
  ]);
  const create = can({ abilities, permission: CREATE }) ? <CreateSetupButton /> : undefined;
  const header = (
    <AdminHeader
      title={t("plural")}
      description={t("listDescription")}
      actions={create}
      inTab={inTab}
    />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <AdminPage header={header}>
        <ErrorState errorKey={errorKey} inline={inTab} />
      </AdminPage>
    );
  }
  const { items } = result.value;
  return (
    <AdminPage header={header}>
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <SetupTable setups={items} access={rowAccess({ abilities, feature: "configuration" })} />
      )}
    </AdminPage>
  );
}
