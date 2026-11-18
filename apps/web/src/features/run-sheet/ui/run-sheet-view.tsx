import type { DateTimeFormat } from "@bibi/core/schemas";
import { PageBand, PageBands } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { documentRows } from "../document-rows";
import type { RunSheetViewData } from "../load-run-sheet-views";
import { RunSheetHistory } from "./run-sheet-history";
import { RunSheetNeedTable, RunSheetTaskTable } from "./run-sheet-tables";
import { RunSheetVersions } from "./run-sheet-versions";
import { RunSheetViewHeader } from "./run-sheet-view-header";

export type RunSheetViewProps = RunSheetViewData & {
  dates: DateTimeFormat;
  /** On its own page (`/run-sheets/{id}`), or one of several (Today). */
  standalone: boolean;
  /** Whether the title can be edited in place (standalone only). */
  canRename?: boolean;
};

/**
 * One run sheet version (ADR 0092), the same on its own page and on Today: who it is for and
 * whether it is the current version, what to deliver and the counted needs as tables with ★ on
 * what changed since the last published version, then every version of it and its state change history.
 */
export function RunSheetView({
  runSheet,
  name,
  fields,
  versions,
  dates,
  standalone,
  canRename,
}: RunSheetViewProps) {
  const t = useTranslations("runSheet");
  const { tasks, needs } = documentRows({ runSheet, dates, wholeOrder: t("onOrder") });
  const current = versions.find((version) => version.current);
  const Heading = standalone ? "h2" : "h3";

  const header = (
    <RunSheetViewHeader {...{ runSheet, name, current, dates, standalone, canRename }} />
  );
  const taskTable = <RunSheetTaskTable tasks={tasks} fields={fields} />;
  const taskTitle = <Heading className="font-serif text-xl">{t("document.tasks")}</Heading>;
  const needTitle = <Heading className="font-serif text-xl">{t("document.needs")}</Heading>;

  // On its own page the sections are bands, like the order page.
  if (standalone) {
    return (
      <PageBands data-slot="run-sheet-view">
        <PageBand containerClassName="gap-4 pt-4 sm:pt-6">{header}</PageBand>
        <PageBand data-tour="run-sheet.tasks" containerClassName="gap-3">
          {taskTitle}
          {taskTable}
        </PageBand>
        {needs.length > 0 ? (
          <PageBand data-tour="run-sheet.needs" containerClassName="gap-3">
            {needTitle}
            <RunSheetNeedTable needs={needs} />
          </PageBand>
        ) : null}
        <PageBand data-tour="run-sheet.versions" containerClassName="gap-8">
          <RunSheetVersions versions={versions} shownId={runSheet.id} dates={dates} />
          <RunSheetHistory versions={versions} dates={dates} />
        </PageBand>
      </PageBands>
    );
  }

  return (
    <article data-slot="run-sheet-view" className="grid gap-8">
      {header}
      <section className="grid gap-3">
        {taskTitle}
        {taskTable}
      </section>
      {needs.length > 0 ? (
        <section className="grid gap-3">
          {needTitle}
          <RunSheetNeedTable needs={needs} />
        </section>
      ) : null}
      <RunSheetVersions versions={versions} shownId={runSheet.id} dates={dates} />
    </article>
  );
}
