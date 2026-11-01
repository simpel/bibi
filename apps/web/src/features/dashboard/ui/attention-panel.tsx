import type { DateTimeFormat, NumberFormat } from "@bibi/core/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { attentionRows } from "../lib/attention-rows";
import { ticketLabel } from "../lib/ticket-label";
import { AttentionRow } from "./attention-row";
import type { DashboardWireish } from "./dashboard-wireish";

export type AttentionPanelProps = {
  summary: Pick<DashboardWireish, "attention" | "currency" | "timeZone">;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/** What staff should act on (ADR 0080): overdue invoices, expiring holds and unsent sheets. */
export function AttentionPanel({ summary, dates, numbers }: AttentionPanelProps) {
  const t = useTranslations("dashboard");
  const { attention, currency, timeZone } = summary;
  const rows = attentionRows({
    attention,
    texts: {
      ticket: (row) =>
        ticketLabel({
          ...{ reference: row.reference, customerName: row.customerName ?? null },
          label: (values) => t("ticket", values),
          withCustomer: (values) => t("ticketCustomer", values),
        }),
      date: (value) => dates.date({ instant: new Date(value), timeZone }),
      money: (minor) => numbers.money({ minor, currency }),
      overdue: (values) => t("attention.overdue", values),
      expiring: (values) => t("attention.expiring", values),
      unsent: (values) => t("attention.unsent", values),
    },
  });
  return (
    <Card data-slot="dashboard-attention" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("attention.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("attention.empty")}</p>
        ) : (
          <ul className="grid divide-y">
            {rows.map(({ key, ...row }) => (
              <AttentionRow key={key} {...row} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
