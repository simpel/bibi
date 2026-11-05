import { listVenues } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities, rowAccess } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateVenueButton } from "./create-venue-button";
import { VenueTable } from "./venue-table";

export type VenueListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 100;

/** Venue list page body: header and unified table with `QuerySearch` and `DataTablePagination`. */
export async function VenueList({ locale, cursor }: VenueListProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("venue"),
    getCallerAbilities(),
    runOperation({
      operation: listVenues,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
  ]);
  const create = can({ abilities, permission: "venue:write" }) ? <CreateVenueButton /> : undefined;
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
  const { items } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      {items.length === 0 && !cursor ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <VenueTable venues={items} access={rowAccess({ abilities, feature: "venue" })} />
      )}
    </div>
  );
}
