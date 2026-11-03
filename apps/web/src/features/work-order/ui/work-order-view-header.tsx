import type { DateTimeFormat, WorkOrderDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import { CurrentVersionBadge } from "./current-version-badge";
import { WorkOrderMatches } from "./work-order-matches";
import { WorkOrderStatus } from "./work-order-status";

export type WorkOrderViewHeaderProps = {
  workOrder: WorkOrderDto;
  name: string | null;
  /** The current version of the same work order, linked when this one is older. */
  current: WorkOrderDto | undefined;
  dates: DateTimeFormat;
  /** On its own page: an h1 and the way back to the ticket; in a list: an h2 linking to the page. */
  standalone: boolean;
};

/** The ticket's label, time and headcount from the work order's TICKET row. */
function useTicketLine({
  workOrder,
  dates,
}: Pick<WorkOrderViewHeaderProps, "workOrder" | "dates">) {
  const t = useTranslations("workOrder");
  const ticket = workOrder.content.rows.find((row) => row.kind === "TICKET");
  // Versions before titles hold the bare reference.
  const label =
    ticket && /^\d+$/.test(ticket.label) ? t("ticket", { reference: ticket.label }) : ticket?.label;
  const when =
    ticket?.startsAt && ticket.endsAt
      ? dates.dateTimeRange({ start: ticket.startsAt, end: ticket.endsAt })
      : null;
  const guests = ticket?.quantity != null ? t("headcount", { count: ticket.quantity }) : null;
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

/** Title, whether this is the current version, the ticket and its time, status and matches. */
export function WorkOrderViewHeader(props: WorkOrderViewHeaderProps) {
  const { workOrder, name, current, dates, standalone } = props;
  const t = useTranslations("workOrder");
  const title = name ?? t("singular");
  const page = listItemRoute({ list: ROUTES.workOrders, id: workOrder.id });
  return (
    <header className="grid gap-3">
      {standalone ? (
        <Link
          href={listItemRoute({ list: ROUTES.tickets, id: workOrder.ticketId })}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("document.back")}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Title title={title} href={page} standalone={standalone} />
        <CurrentVersionBadge current={workOrder.current} version={workOrder.version} />
        {!workOrder.current && current ? (
          <Link
            href={listItemRoute({ list: ROUTES.workOrders, id: current.id })}
            className="text-sm font-medium underline underline-offset-4"
          >
            {t("goToCurrent")}
          </Link>
        ) : null}
      </div>
      <p className="text-muted-foreground">{useTicketLine({ workOrder, dates })}</p>
      <WorkOrderStatus workOrder={workOrder} dates={dates} />
      <WorkOrderMatches matches={workOrder.matches} />
    </header>
  );
}
