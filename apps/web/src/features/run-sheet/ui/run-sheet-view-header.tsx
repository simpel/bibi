import type { DateTimeFormat, RunSheetDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import { CurrentVersionBadge } from "./current-version-badge";
import { FulfillRunSheetButton } from "./fulfill-run-sheet-button";
import { PublishRunSheetButton } from "./publish-run-sheet-button";
import { RunSheetMatches } from "./run-sheet-matches";
import { RunSheetStatus } from "./run-sheet-status";

export type RunSheetViewHeaderProps = {
  runSheet: RunSheetDto;
  name: string | null;
  /** The current version of the same run sheet, linked when this one is older. */
  current: RunSheetDto | undefined;
  dates: DateTimeFormat;
  /** On its own page: an h1 and the way back to the order; in a list: an h2 linking to the page. */
  standalone: boolean;
};

/** The order's label, time and headcount from the run sheet's ORDER row. */
function useOrderLine({ runSheet, dates }: Pick<RunSheetViewHeaderProps, "runSheet" | "dates">) {
  const t = useTranslations("runSheet");
  const order = runSheet.content.rows.find((row) => row.kind === "ORDER");
  // Versions before titles hold the bare reference.
  const label =
    order && /^\d+$/.test(order.label) ? t("order", { reference: order.label }) : order?.label;
  const when =
    order?.startsAt && order.endsAt
      ? dates.dateTimeRange({ start: order.startsAt, end: order.endsAt })
      : null;
  const guests = order?.quantity != null ? t("headcount", { count: order.quantity }) : null;
  return [label, when, guests].filter(Boolean).join(" · ");
}

type TitleProps = { title: string; href: string; standalone: boolean };

/** The page's h1, or in a list an h2 linking to the version's page. */
const Title = ({ title, href, standalone }: TitleProps) =>
  standalone ? (
    <h1 className="font-serif text-3xl">{title}</h1>
  ) : (
    <h2 className="font-serif text-2xl">
      <Link href={href} className="underline-offset-4 hover:underline">
        {title}
      </Link>
    </h2>
  );

/** Title, whether this is the current version, the order and its time, status, actions and matches. */
export function RunSheetViewHeader(props: RunSheetViewHeaderProps) {
  const { runSheet, name, current, dates, standalone } = props;
  const t = useTranslations("runSheet");
  const title = name ?? t("singular");
  const page = listItemRoute({ list: ROUTES.runSheets, id: runSheet.id });

  return (
    <header className="grid gap-3">
      {standalone ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={listItemRoute({ list: ROUTES.orders, id: runSheet.orderId })}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("document.back")}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {!runSheet.publishedAt && !runSheet.blocked && runSheet.current ? (
              <PublishRunSheetButton id={runSheet.id} />
            ) : null}
            {runSheet.publishedAt && !runSheet.blocked && runSheet.current ? (
              <FulfillRunSheetButton id={runSheet.id} fulfilled={Boolean(runSheet.fulfilledAt)} />
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Title title={title} href={page} standalone={standalone} />
        <CurrentVersionBadge current={runSheet.current} version={runSheet.version} />
        {!runSheet.current && current ? (
          <Link
            href={listItemRoute({ list: ROUTES.runSheets, id: current.id })}
            className="text-sm font-medium underline underline-offset-4"
          >
            {t("goToCurrent")}
          </Link>
        ) : null}
      </div>
      <p className="text-muted-foreground">{useOrderLine({ runSheet, dates })}</p>
      <RunSheetStatus runSheet={runSheet} dates={dates} />
      <RunSheetMatches matches={runSheet.matches} />
    </header>
  );
}
