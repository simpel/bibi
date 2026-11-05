import type { DateTimeFormat } from "@bibi/core/schemas";
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
}: RunSheetViewProps) {
  const t = useTranslations("runSheet");
  const { tasks, needs } = documentRows({ runSheet, dates, wholeOrder: t("onOrder") });
  const current = versions.find((version) => version.current);
  const Heading = standalone ? "h2" : "h3";

  return (
    <article data-slot="run-sheet-view" className="grid gap-8">
      <RunSheetViewHeader {...{ runSheet, name, current, dates, standalone }} />
      <section className="grid gap-3">
        <Heading className="font-serif text-xl">{t("document.tasks")}</Heading>
        <RunSheetTaskTable tasks={tasks} fields={fields} />
      </section>
      {needs.length > 0 ? (
        <section className="grid gap-3">
          <Heading className="font-serif text-xl">{t("document.needs")}</Heading>
          <RunSheetNeedTable needs={needs} />
        </section>
      ) : null}
      <RunSheetVersions versions={versions} shownId={runSheet.id} dates={dates} />
      {standalone ? <RunSheetHistory versions={versions} dates={dates} /> : null}
    </article>
  );
}
