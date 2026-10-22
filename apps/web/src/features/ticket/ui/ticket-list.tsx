import { listTickets, type TicketDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import {
  type MineFilter,
  MineFilterLinks,
  minePageInput,
} from "@/features/assignment/ui/mine-filter";
import { ROUTES } from "@/lib/routes";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadTicketData } from "../load-ticket-data";
import { CreateTicketButton } from "./create-ticket-button";
import { ExpireHoldsButton } from "./expire-holds-button";
import { TicketListTable } from "./ticket-list-table";

export type TicketListProps = {
  locale: Locale;
  cursor?: string | undefined;
  /** Only tickets the signed-in member is assigned to or follows (ADR 0034). */
  mine?: MineFilter | undefined;
};

const PAGE_SIZE = 20;

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

/** Tickets page body: header with create, the table (or an empty state) and pagination. */
export async function TicketList({ locale, cursor, mine }: TicketListProps) {
  const t = await getTranslations("ticket");
  const abilities = await getCallerAbilities();
  const [data, result] = await Promise.all([
    loadTicketData(),
    runOperation({
      operation: listTickets,
      input: minePageInput({ limit: PAGE_SIZE, cursor, mine, userId: abilities.userId }),
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  const { create, actions } = headerParts({ abilities, noTypes });
  const page: { items: TicketDto[]; nextCursor: string | null } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={actions} />
      <MineFilterLinks pathname={ROUTES.tickets} mine={mine} />
      {page.items.length === 0 && !cursor && !mine ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? <GoToTypes label={t("goToTypes")} /> : create}
        />
      ) : (
        <>
          <TicketListTable tickets={page.items} data={data.value} />
          <CursorPagination
            pathname={ROUTES.tickets}
            cursor={cursor}
            nextCursor={page.nextCursor}
            query={mine ? { mine } : {}}
          />
        </>
      )}
    </div>
  );
}
