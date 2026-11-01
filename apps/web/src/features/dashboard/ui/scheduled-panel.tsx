import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { FinanceSection } from "@/features/finance/ui/finance-section";
import { ticketRoute } from "@/lib/routes";
import { ticketLabel } from "../lib/ticket-label";
import { AttentionRow } from "./attention-row";
import type { DashboardWireish } from "./dashboard-wireish";

export type ScheduledPanelProps = {
  summary: Pick<DashboardWireish, "scheduled" | "timeZone">;
  dates: DateTimeFormat;
};

/** Open tickets with lines starting in the range, soonest first (ADR 0080, 0086). */
export function ScheduledPanel({ summary, dates }: ScheduledPanelProps) {
  const t = useTranslations("dashboard");
  const { scheduled, timeZone } = summary;
  return (
    <FinanceSection title={t("scheduled.title")} data={scheduled} emptyText={t("scheduled.empty")}>
      <ul className="grid divide-y">
        {scheduled.map((row) => (
          <AttentionRow
            key={row.ticketId}
            href={ticketRoute({ id: row.ticketId })}
            title={ticketLabel({
              ...{ reference: row.reference, customerName: row.customerName },
              label: (values) => t("ticket", values),
              withCustomer: (values) => t("ticketCustomer", values),
            })}
            detail={t("scheduled.detail", {
              date: dates.dateTime({ instant: new Date(row.startsAt), timeZone }),
              status: row.statusName,
              count: row.lines,
            })}
          />
        ))}
      </ul>
    </FinanceSection>
  );
}
