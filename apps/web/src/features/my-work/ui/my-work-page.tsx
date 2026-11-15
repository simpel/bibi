import { viewMyWork } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { laterHref } from "../lib/my-work-window";
import { MyWorkTimeline } from "./my-work-timeline";

export type MyWorkPageProps = { locale: Locale; from: string; to: string; today: string };

/**
 * The start page (ADR 0110, spec: home): a timeline of every order that concerns the signed-in
 * member, one card per order per day, from `from` to `to`. One read: `myWork.view`.
 */
export async function MyWorkPage({ locale, from, to, today }: MyWorkPageProps) {
  const [t, dates, result] = await Promise.all([
    getTranslations({ locale, namespace: "myWork" }),
    getDateTimeFormat(),
    runOperation({ operation: viewMyWork, input: { from, to } }),
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
  return (
    <SimplePage>
      <div data-slot="my-work" className="mx-auto grid w-full max-w-2xl gap-6">
        {header}
        {from !== today ? (
          <Link href={ROUTES.home} className={linkClass}>
            {t("backToToday")}
          </Link>
        ) : null}
        <MyWorkTimeline work={result.value} dates={dates} />
        <Link href={laterHref({ to, today })} className={linkClass}>
          {t("later")}
        </Link>
      </div>
    </SimplePage>
  );
}
