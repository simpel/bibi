import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { documentRows } from "../document-rows";
import type { WorkOrderViewData } from "../load-work-order-views";
import { WorkOrderNeedTable, WorkOrderTaskTable } from "./work-order-tables";
import { WorkOrderVersions } from "./work-order-versions";
import { WorkOrderViewHeader } from "./work-order-view-header";

export type WorkOrderViewProps = WorkOrderViewData & {
  dates: DateTimeFormat;
  /** On its own page (`/work-orders/{id}`), or one of several (Today). */
  standalone: boolean;
};

/**
 * One work order version (ADR 0092), the same on its own page and on Today: who it is for and
 * whether it is the current version, what to deliver and the counted needs as tables with ★ on
 * what changed since the last sent version, then every version of it.
 */
export function WorkOrderView({
  workOrder,
  name,
  fields,
  versions,
  dates,
  standalone,
}: WorkOrderViewProps) {
  const t = useTranslations("workOrder");
  const { tasks, needs } = documentRows({ workOrder, dates, wholeTicket: t("onTicket") });
  const current = versions.find((version) => version.current);
  const Heading = standalone ? "h2" : "h3";
  return (
    <article data-slot="work-order-view" className="grid gap-8">
      <WorkOrderViewHeader {...{ workOrder, name, current, dates, standalone }} />
      <section className="grid gap-3">
        <Heading className="font-serif text-xl">{t("document.tasks")}</Heading>
        <WorkOrderTaskTable tasks={tasks} fields={fields} />
      </section>
      {needs.length > 0 ? (
        <section className="grid gap-3">
          <Heading className="font-serif text-xl">{t("document.needs")}</Heading>
          <WorkOrderNeedTable needs={needs} />
        </section>
      ) : null}
      <WorkOrderVersions versions={versions} shownId={workOrder.id} dates={dates} />
    </article>
  );
}
