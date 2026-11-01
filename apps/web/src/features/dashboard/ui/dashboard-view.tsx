import type { DashboardSummary, DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import { plainDayText } from "@/lib/time/plain-day";
import { AttentionPanel } from "./attention-panel";
import { BookedAheadCard } from "./booked-ahead-card";
import { ComingUpPanel } from "./coming-up-panel";
import { PipelineTiles } from "./pipeline-tiles";
import { UtilisationPanel } from "./utilisation-panel";

export type DashboardViewProps = {
  summary: DashboardSummary;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/** Today and the next four weeks (ADR 0080): the pipeline, what to act on and what is ahead. */
export function DashboardView({ summary, dates, numbers }: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const finance = useTranslations("finance");
  const { from, to, currency, timeZone } = summary;
  const day = ({ value }: { value: string }) => plainDayText({ day: value, timeZone, dates });
  const range = finance("period.range", { from: day({ value: from }), to: day({ value: to }) });
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description", { range })} />
      <PipelineTiles statuses={summary.statuses} currency={currency} numbers={numbers} />
      <div className="grid gap-4 md:grid-cols-2">
        <AttentionPanel summary={summary} dates={dates} numbers={numbers} />
        <ComingUpPanel summary={summary} dates={dates} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {summary.utilisation ? (
          <UtilisationPanel utilisation={summary.utilisation} numbers={numbers} />
        ) : null}
        {summary.bookedAhead ? <BookedAheadCard summary={summary} numbers={numbers} /> : null}
      </div>
    </div>
  );
}
