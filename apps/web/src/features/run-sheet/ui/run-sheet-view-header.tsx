import type { DateTimeFormat, RunSheetDto } from "@bibi/core/schemas";
import { type KeyFact, KeyFacts } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { desiredWhen } from "@/features/order/ui/desired-period";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import { CurrentVersionBadge } from "./current-version-badge";
import { FulfillRunSheetButton } from "./fulfill-run-sheet-button";
import { PublishRunSheetButton } from "./publish-run-sheet-button";
import { RunSheetMatches } from "./run-sheet-matches";
import { RunSheetStatus } from "./run-sheet-status";
import { RunSheetTitle } from "./run-sheet-title";

export type RunSheetViewHeaderProps = {
  runSheet: RunSheetDto;
  name: string | null;
  /** The current version of the same run sheet, linked when this one is older. */
  current: RunSheetDto | undefined;
  dates: DateTimeFormat;
  /** On its own page: an h1 and the way back to the order; in a list: an h2 linking to the page. */
  standalone: boolean;
  /** Standalone only: the name is the definition's, so it needs `template:write`. */
  canRename?: boolean;
};

/** The order's label and time from the run sheet's ORDER row. */
function useOrderFacts({ runSheet, dates }: Pick<RunSheetViewHeaderProps, "runSheet" | "dates">) {
  const t = useTranslations("runSheet");
  const order = runSheet.content.rows.find((row) => row.kind === "ORDER");
  // Versions before titles hold the bare reference.
  const label =
    order && /^\d+$/.test(order.label) ? t("order", { reference: order.label }) : order?.label;
  const when = desiredWhen({
    order: { desiredStartsAt: order?.startsAt ?? null, desiredEndsAt: order?.endsAt ?? null },
    format: dates,
  });
  return { label, when };
}

type Instant = Date | string;

/** A moment as weekday and date over the time, like the order page's dates. */
const moment = ({ instant, dates }: { instant: Instant; dates: DateTimeFormat }) => {
  const at = new Date(instant);
  return {
    preheader: dates.date({ instant: at, weekday: "short", year: true }),
    value: dates.time({ instant: at }),
  };
};

/** When it is, the headcount and when it was published or marked done, as the order page's key facts. */
function RunSheetFacts({ runSheet, dates }: Pick<RunSheetViewHeaderProps, "runSheet" | "dates">) {
  const t = useTranslations("runSheet");
  const { label, when } = useOrderFacts({ runSheet, dates });
  const facts: KeyFact[] = [];
  if (label) {
    // "Kick-off · #41": the title, then the number as everywhere else (dimmed sans).
    const [, title = label, reference] = label.match(/^(.*) · (#\d+)$/) ?? [];
    facts.push({
      label: t("facts.order"),
      truncate: true,
      title: label,
      value: (
        <span className="flex min-w-0 items-baseline gap-2">
          <Link
            href={listItemRoute({ list: ROUTES.orders, id: runSheet.orderId })}
            className="truncate"
          >
            {title}
          </Link>
          {reference ? (
            <span className="shrink-0 font-normal font-sans text-muted-foreground text-xl tabular-nums">
              {reference}
            </span>
          ) : null}
        </span>
      ),
    });
  }
  if (when.value !== "–") facts.push({ label: t("facts.when"), ...when });
  if (runSheet.publishedAt) {
    facts.push({
      label: t("facts.published"),
      ...moment({ instant: runSheet.publishedAt, dates }),
    });
  }
  if (runSheet.fulfilledAt) {
    facts.push({
      label: t("facts.fulfilled"),
      ...moment({ instant: runSheet.fulfilledAt, dates }),
    });
  }
  return facts.length > 0 ? (
    <div data-tour="run-sheet.facts">
      <KeyFacts facts={facts} />
    </div>
  ) : null;
}

type TitleProps = {
  title: string;
  href: string;
  standalone: boolean;
  /** Set when the name is the definition's and the caller may edit it. */
  rename: { definitionId: string } | null;
};

/** The page's h1 (editable in place when allowed), or in a list an h2 linking to the version's page. */
const Title = ({ title, href, standalone, rename }: TitleProps) =>
  standalone ? (
    rename ? (
      <RunSheetTitle definitionId={rename.definitionId} name={title} canEdit />
    ) : (
      <h1 className="font-serif text-3xl">{title}</h1>
    )
  ) : (
    <h2 className="font-serif text-2xl">
      <Link href={href} className="underline-offset-4 hover:underline">
        {title}
      </Link>
    </h2>
  );

/** Title, whether this is the current version, the order and its time, status, actions and matches. */
export function RunSheetViewHeader(props: RunSheetViewHeaderProps) {
  const { runSheet, name, current, dates, standalone, canRename } = props;
  const t = useTranslations("runSheet");
  const title = name ?? t("singular");
  const page = listItemRoute({ list: ROUTES.runSheets, id: runSheet.id });

  const actions = standalone ? (
    <div data-tour="run-sheet.status" className="flex flex-wrap items-center gap-2">
      <RunSheetStatus runSheet={runSheet} dates={dates} hideDates hideVersion />
      {!runSheet.publishedAt && !runSheet.blocked && runSheet.current ? (
        <PublishRunSheetButton id={runSheet.id} />
      ) : null}
      {runSheet.publishedAt && !runSheet.blocked && runSheet.current ? (
        <FulfillRunSheetButton id={runSheet.id} fulfilled={Boolean(runSheet.fulfilledAt)} />
      ) : null}
    </div>
  ) : null;

  return (
    <header className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Title
            title={title}
            href={page}
            standalone={standalone}
            rename={
              canRename && name !== null ? { definitionId: runSheet.runSheetDefinitionId } : null
            }
          />
          {/* Only a version that is not the current one is flagged. */}
          {runSheet.current && standalone ? null : (
            <CurrentVersionBadge current={runSheet.current} version={runSheet.version} />
          )}
          {!runSheet.current && current ? (
            <Link
              href={listItemRoute({ list: ROUTES.runSheets, id: current.id })}
              className="text-sm font-medium underline underline-offset-4"
            >
              {t("goToCurrent")}
            </Link>
          ) : null}
        </div>
        {actions}
      </div>
      {standalone ? null : <RunSheetStatus runSheet={runSheet} dates={dates} hideDates />}
      <RunSheetFacts runSheet={runSheet} dates={dates} />
      <RunSheetMatches matches={runSheet.matches} />
    </header>
  );
}
