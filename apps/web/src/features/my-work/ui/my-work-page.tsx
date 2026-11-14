import { viewMyWork } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { activePeriod, myWorkHref, myWorkPeriods } from "../lib/my-work-periods";
import { AskBibi } from "./ask-bibi";
import { MyWorkChanges } from "./my-work-changes";
import { MyWorkPeriods } from "./my-work-periods";
import { MyWorkRunSheets } from "./my-work-run-sheets";
import { MyWorkTodo } from "./my-work-todo";

export type MyWorkPageProps = {
  locale: Locale;
  from: string;
  to: string;
  today: string;
  /** The page of run sheet rows, from `?page=` (1 when absent or not a number). */
  page: number;
};

/**
 * The start page (ADR 0110): what concerns the signed-in member in a period. Run sheet rows per
 * day lead, To do beside them, What changed below. One read: `myWork.view`.
 */
export async function MyWorkPage({ locale, from, to, today, page }: MyWorkPageProps) {
  const [t, dates, result] = await Promise.all([
    getTranslations({ locale, namespace: "myWork" }),
    getDateTimeFormat(),
    runOperation({ operation: viewMyWork, input: { from, to, page } }),
  ]);
  const periods = myWorkPeriods({ today });
  const base = myWorkHref({ from, to, today });
  const pageHref = ({ page: next }: { page: number }) => (next > 1 ? `${base}?page=${next}` : base);
  // Ask Bibi leads the page; the period switch then drives everything below it.
  const header = (
    <div className="grid gap-5">
      <PageHeader title={t("title")} description={t("description")} />
      <AskBibi />
      <MyWorkPeriods periods={periods} active={activePeriod({ periods, from, to })} />
    </div>
  );
  if (!result.ok) {
    return (
      <SimplePage>
        {header}
        <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />
      </SimplePage>
    );
  }
  const work = result.value;
  return (
    <SimplePage>
      <div data-slot="my-work" className="grid gap-6">
        {header}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <MyWorkRunSheets work={work} dates={dates} pageHref={pageHref} />
          <MyWorkTodo work={work} dates={dates} />
        </div>
        <MyWorkChanges notifications={work.notifications} unread={work.unreadNotifications} />
      </div>
    </SimplePage>
  );
}
