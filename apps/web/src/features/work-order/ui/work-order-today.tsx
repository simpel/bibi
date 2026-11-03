import { listWorkOrders } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button, Separator } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Fragment } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadOrganizationTimeZone } from "@/server/time-zones";
import { todayWindow } from "../lib/today-window";
import { loadWorkOrderViews } from "../load-work-order-views";
import { WorkOrderView } from "./work-order-view";

/** My current work orders: the slot is mine (assignee or follower), the version the newest. */
const MINE_NOW = "involves:me is:current";

const SeeAll = ({ label }: { label: string }) => (
  <Button asChild variant="outline">
    <Link href={ROUTES.workOrdersAll}>{label}</Link>
  </Button>
);

/** Loads today's work orders in the ticket's start order, with what each view shows. */
async function loadToday() {
  const window = todayWindow({ now: new Date(), timeZone: await loadOrganizationTimeZone() });
  const input = { q: MINE_NOW, ...window, sort: "when" as const, direction: "asc" as const };
  const found = await runOperation({ operation: listWorkOrders, input });
  if (!found.ok) return found;
  return loadWorkOrderViews({ workOrders: found.value.items });
}

/** Today (the Work orders section's default): each of my work orders for today, in full. */
export async function WorkOrderToday({ locale }: { locale: Locale }) {
  const t = await getTranslations("workOrder.today");
  const [dates, loaded] = await Promise.all([getDateTimeFormat(), loadToday()]);
  if (!loaded.ok) return <ErrorState errorKey={handleLoadError({ error: loaded.error, locale })} />;
  const actions = <SeeAll label={t("seeAll")} />;
  return (
    <div className="grid gap-8">
      <PageHeader title={t("title")} description={t("description")} actions={actions} />
      {loaded.value.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={actions} />
      ) : (
        loaded.value.map((view, index) => (
          <Fragment key={view.workOrder.id}>
            {index > 0 ? <Separator /> : null}
            <WorkOrderView {...view} dates={dates} standalone={false} />
          </Fragment>
        ))
      )}
    </div>
  );
}
