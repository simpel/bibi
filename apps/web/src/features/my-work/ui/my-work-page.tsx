import { viewMyTasks, viewMyWork } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { buildTableQuery } from "@/components/data-table/table-filter-query";
import { SavedViews } from "@/components/saved-views/saved-views";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { countDue } from "../lib/count-due";
import { filterMyWork, myWorkQualifiers } from "../lib/my-work-query";
import { myWorkHref } from "../lib/my-work-window";
import { MyWorkLater } from "./my-work-later";
import { MyWorkSearch } from "./my-work-search";
import { MyWorkTimeline } from "./my-work-timeline";
import { NeedsYou } from "./needs-you";
import { SyncMyWorkDue } from "./sync-my-work-due";

export type MyWorkPageProps = {
  locale: Locale;
  from: string;
  to: string;
  today: string;
  /** The search (`?q=`): free text and `status:`, `customer:`, `place:`. */
  q?: string | undefined;
};

/**
 * The start page (ADR 0110, spec: home): Needs you (what the member must act on, today's window
 * only), then a timeline of every order that concerns them in Today, This week, Next week and
 * Later, one card per order per day. Two reads in parallel on load (`myWork.tasks`,
 * `myWork.view` today to the end of next week); Later reads on as the member scrolls. The search
 * (`?q=`) filters the timeline, as on the tables.
 */
export async function MyWorkPage({ locale, from, to, today, q }: MyWorkPageProps) {
  const startPage = from === today;
  const [t, dates, numbers, result, tasks] = await Promise.all([
    getTranslations({ locale, namespace: "myWork" }),
    getDateTimeFormat(),
    getNumberFormat(),
    runOperation({ operation: viewMyWork, input: { from, to } }),
    startPage ? runOperation({ operation: viewMyTasks, input: {} }) : null,
  ]);
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (!result.ok) {
    return (
      <SimplePage>
        {header}
        <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />
      </SimplePage>
    );
  }
  const linkClass = "text-sm font-medium hover:underline";
  const all = result.value.cards;
  const labels = {
    status: t("search.status"),
    customer: t("search.customer"),
    place: t("search.place"),
  };
  const cards = all ? filterMyWork({ cards: all, q, labels }) : null;
  return (
    <SimplePage>
      <div data-slot="my-work" className="mx-auto grid w-full max-w-2xl gap-6">
        {header}
        {tasks?.ok ? <NeedsYou tasks={tasks.value.tasks} numbers={numbers} /> : null}
        {tasks?.ok ? <SyncMyWorkDue count={countDue({ tasks: tasks.value.tasks })} /> : null}
        {tasks && !tasks.ok ? (
          <ErrorState inline errorKey={handleLoadError({ error: tasks.error, locale })} />
        ) : null}
        {!startPage ? (
          <Link href={ROUTES.home} className={linkClass}>
            {t("backToToday")}
          </Link>
        ) : null}
        {all ? (
          <MyWorkSearch q={q} cards={all}>
            <SavedViews
              listId="my-work"
              defaults={["all"]}
              pathname={myWorkHref({ from, to, today })}
              q={q}
              vocabulary={
                buildTableQuery({ qualifiers: myWorkQualifiers({ cards: all, labels }) }).vocabulary
              }
            />
          </MyWorkSearch>
        ) : null}
        <MyWorkTimeline
          work={{ ...result.value, cards }}
          dates={dates}
          later={
            result.value.cards ? (
              <MyWorkLater next={result.value.next} timeZone={result.value.timeZone} q={q} />
            ) : null
          }
        />
      </div>
    </SimplePage>
  );
}
