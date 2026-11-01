import type {
  DashboardSummary,
  DateTimeFormat,
  FinanceOverviewDto,
  NumberFormat,
  PlainDate,
} from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/states/page-header";
import { PeriodSwitcher } from "@/features/finance/ui/period-switcher";
import { ROUTES } from "@/lib/routes";
import { plainDayText } from "@/lib/time/plain-day";
import { EconomyPanel } from "./economy-panel";
import { OutcomesPanel } from "./outcomes-panel";
import { PipelineTiles } from "./pipeline-tiles";
import { UtilisationPanel } from "./utilisation-panel";

export type DashboardViewProps = {
  summary: DashboardSummary;
  /** `null` without `finance:read`: the economy panel is left out. */
  overview: FinanceOverviewDto | null;
  today: PlainDate;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/** The pipeline now, then the period's outcomes, money and utilisation; a part without access is absent. */
export function DashboardView({ summary, overview, today, dates, numbers }: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const finance = useTranslations("finance");
  const { from, to, currency, timeZone } = summary;
  const day = ({ value }: { value: string }) => plainDayText({ day: value, timeZone, dates });
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<PeriodSwitcher period={{ from, to }} today={today} base={ROUTES.dashboard} />}
      />
      <PipelineTiles statuses={summary.statuses} currency={currency} numbers={numbers} />
      <p className="text-sm text-muted-foreground">
        {finance("period.range", { from: day({ value: from }), to: day({ value: to }) })}
      </p>
      {summary.outcomes ? (
        <OutcomesPanel outcomes={summary.outcomes} currency={currency} numbers={numbers} />
      ) : null}
      {overview ? <EconomyPanel overview={overview} numbers={numbers} /> : null}
      {summary.utilisation ? (
        <UtilisationPanel utilisation={summary.utilisation} numbers={numbers} />
      ) : null}
    </div>
  );
}
