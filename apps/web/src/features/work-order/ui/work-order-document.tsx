import type { DateTimeFormat, WorkOrderDto } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { documentRows } from "../document-rows";
import { loadWorkOrderDocument } from "../load-work-order-document";
import { WorkOrderMatches } from "./work-order-matches";
import { WorkOrderStatus } from "./work-order-status";
import { WorkOrderNeedTable, WorkOrderTaskTable } from "./work-order-tables";

type HeaderProps = { workOrder: WorkOrderDto; name: string | null; dates: DateTimeFormat };

/** Back to the ticket, the work order's name, the ticket and its time, status and matches. */
async function DocumentHeader({ workOrder, name, dates }: HeaderProps) {
  const t = await getTranslations("workOrder");
  const ticket = workOrder.content.rows.find((row) => row.kind === "TICKET");
  // Versions before titles hold the bare reference.
  const label =
    ticket && /^\d+$/.test(ticket.label) ? t("ticket", { reference: ticket.label }) : ticket?.label;
  const when =
    ticket?.startsAt && ticket.endsAt
      ? dates.dateTimeRange({ start: ticket.startsAt, end: ticket.endsAt })
      : null;
  const guests = ticket?.quantity != null ? t("headcount", { count: ticket.quantity }) : null;
  return (
    <header className="grid gap-3">
      <Link
        href={listItemRoute({ list: ROUTES.tickets, id: workOrder.ticketId })}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("document.back")}
      </Link>
      <h1 className="font-serif text-3xl">{name ?? t("singular")}</h1>
      <p className="text-muted-foreground">{[label, when, guests].filter(Boolean).join(" · ")}</p>
      <WorkOrderStatus workOrder={workOrder} dates={dates} />
      <WorkOrderMatches matches={workOrder.matches} />
    </header>
  );
}

export type WorkOrderDocumentProps = { locale: Locale; id: string };

/**
 * One work order version as a plain document (ADR 0092): who it is for, then what to deliver and
 * the counted needs as tables, with ★ on what changed since the last sent version.
 */
export async function WorkOrderDocument({ locale, id }: WorkOrderDocumentProps) {
  const [t, dates, loaded] = await Promise.all([
    getTranslations("workOrder"),
    getDateTimeFormat(),
    loadWorkOrderDocument({ id }),
  ]);
  if (!loaded.ok) return <ErrorState errorKey={handleLoadError({ error: loaded.error, locale })} />;
  const { workOrder, name, fields } = loaded.value;
  const { tasks, needs } = documentRows({ workOrder, dates, wholeTicket: t("onTicket") });
  return (
    <article data-slot="work-order-document" className="grid gap-8">
      <DocumentHeader workOrder={workOrder} name={name} dates={dates} />
      <section className="grid gap-3">
        <h2 className="font-serif text-xl">{t("document.tasks")}</h2>
        <WorkOrderTaskTable tasks={tasks} fields={fields} />
      </section>
      {needs.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="font-serif text-xl">{t("document.needs")}</h2>
          <WorkOrderNeedTable needs={needs} />
        </section>
      ) : null}
    </article>
  );
}
