import type { DateTimeFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { FinanceSection } from "@/features/finance/ui/finance-section";
import { ticketRoute } from "@/lib/routes";
import { ticketLabel } from "../lib/ticket-label";
import { AttentionRow } from "./attention-row";
import type { DashboardWireish } from "./dashboard-wireish";

export type ComingUpPanelProps = {
  summary: Pick<DashboardWireish, "comingUp" | "timeZone">;
  dates: DateTimeFormat;
};

/** Open tickets with lines starting in the next four weeks, soonest first (ADR 0080). */
export function ComingUpPanel({ summary, dates }: ComingUpPanelProps) {
  const t = useTranslations("dashboard");
  const { comingUp, timeZone } = summary;
  return (
    <FinanceSection title={t("comingUp.title")} data={comingUp} emptyText={t("comingUp.empty")}>
      <ul className="grid divide-y">
        {comingUp.map((row) => (
          <AttentionRow
            key={row.ticketId}
            href={ticketRoute({ id: row.ticketId })}
            title={ticketLabel({
              ...{ reference: row.reference, customerName: row.customerName },
              label: (values) => t("ticket", values),
              withCustomer: (values) => t("ticketCustomer", values),
            })}
            detail={t("comingUp.detail", {
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
