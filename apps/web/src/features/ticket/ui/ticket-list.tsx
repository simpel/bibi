import { listTickets } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { TicketListParams } from "../lib/list-params";
import { toCanonicalQuery } from "../lib/query-canonical";
import { buildQueryCatalog } from "../lib/query-catalog";
import type { QueryVocabulary } from "../lib/query-vocabulary";
import { loadQueryVocabulary } from "../load-query-vocabulary";
import { loadTicketData } from "../load-ticket-data";
import { CreateTicketButton } from "./create-ticket-button";
import { ExpireHoldsButton } from "./expire-holds-button";
import { TicketListTable } from "./ticket-list-table";
import { TicketQuickFilters } from "./ticket-quick-filters";
import { TicketSearch } from "./ticket-search";

export type TicketListProps = {
  locale: Locale;
  /** Page, size, search (with qualifiers), and sort, read from the URL. */
  params: TicketListParams;
};

const GoToTypes = ({ label }: { label: string }) => (
  <Button asChild variant="outline">
    <Link href={ROUTES.settingsTypes}>{label}</Link>
  </Button>
);

/** Expire overdue holds (ADR 0044) and create, for members who write tickets. */
const HeaderActions = ({ create }: { create: ReactNode }) => (
  <>
    <ExpireHoldsButton />
    {create}
  </>
);

type HeaderPartsInput = { abilities: CallerAbilities; noTypes: boolean };

/** The create button (not without types) and the header actions; both need `ticket:write`. */
function headerParts({ abilities, noTypes }: HeaderPartsInput) {
  const canCreate = can({ abilities, permission: "ticket:write" });
  const create = canCreate && !noTypes ? <CreateTicketButton /> : undefined;
  return { create, actions: canCreate ? <HeaderActions create={create} /> : undefined };
}

type ListInputArgs = { params: TicketListParams; vocabulary: QueryVocabulary };

/**
 * `ticket.list` by page number, so the server returns the total for the page count; the search's
 * words of the UI language become core's canonical ones.
 */
const listInput = ({ params, vocabulary }: ListInputArgs) => ({
  page: params.page,
  limit: params.pageSize,
  sort: params.sort,
  direction: params.direction,
  ...(params.q ? { q: toCanonicalQuery({ q: params.q, vocabulary }) } : {}),
});

/** Tickets page body: header with create, filters and search, then the paged table. */
export async function TicketList({ locale, params }: TicketListProps) {
  const t = await getTranslations("ticket");
  const [abilities, vocabulary] = await Promise.all([getCallerAbilities(), loadQueryVocabulary()]);
  const [data, result] = await Promise.all([
    loadTicketData(),
    runOperation({ operation: listTickets, input: listInput({ params, vocabulary }) }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  const { create, actions } = headerParts({ abilities, noTypes });
  const { items, total } = result.value;
  const empty = total === 0 && !params.q;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
      {empty ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? <GoToTypes label={t("goToTypes")} /> : create}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TicketQuickFilters q={params.q} vocabulary={vocabulary} />
            <TicketSearch
              value={params.q}
              vocabulary={vocabulary}
              catalog={buildQueryCatalog({ ...data.value, vocabulary })}
            />
          </div>
          <TicketListTable tickets={items} total={total ?? 0} view={params} data={data.value} />
        </>
      )}
    </div>
  );
}
