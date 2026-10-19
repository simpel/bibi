import { listVenues } from "@okazi/core";
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
import { CreateVenueButton } from "./create-venue-button";
import { VenueSearch } from "./venue-search";
import { VenueTable } from "./venue-table";

export type VenueListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 20;

/** Venue list page body: header, semantic search, table with cursor pagination. */
export async function VenueList({ locale, cursor }: VenueListProps) {
  const t = await getTranslations("venue");
  const abilities = await getCallerAbilities();
  const create = can({ abilities, permission: "venue:create" }) ? <CreateVenueButton /> : undefined;
  const result = await runOperation({
    operation: listVenues,
    input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
  });
  const header = (
    <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return <ListLayout header={header} body={<ErrorState errorKey={errorKey} />} />;
  }
  const { items, nextCursor } = result.value;
  const body =
    items.length === 0 && !cursor ? (
      <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
    ) : (
      <>
        <VenueTable venues={items} access={rowAccess({ abilities, feature: "venue" })} />
        <CursorPagination pathname={ROUTES.venues} cursor={cursor} nextCursor={nextCursor} />
      </>
    );
  return <ListLayout header={header} body={body} withSearch={items.length > 0 || !!cursor} />;
}

type ListLayoutProps = { header: React.ReactNode; body: React.ReactNode; withSearch?: boolean };

function ListLayout({ header, body, withSearch = false }: ListLayoutProps) {
  return (
    <div className="grid gap-6">
      {header}
      {withSearch ? <VenueSearch /> : null}
      {body}
    </div>
  );
}
