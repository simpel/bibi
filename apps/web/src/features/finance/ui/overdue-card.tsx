import type { DateTimeFormat, FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { overdueRows } from "../lib/table-rows";
import { FinanceSection } from "./finance-section";
import { OverdueTable } from "./overdue-table";

export type OverdueCardProps = {
  overview: Pick<FinanceOverviewDto, "aging" | "currency" | "timeZone">;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/** The most overdue invoices today. */
export function OverdueCard({ overview, dates, numbers }: OverdueCardProps) {
  const t = useTranslations("finance");
  const { aging, currency, timeZone } = overview;
  return (
    <FinanceSection title={t("overdue.title")} data={aging?.overdue ?? null} flush>
      <OverdueTable
        rows={overdueRows({
          overdue: aging?.overdue ?? [],
          currency,
          timeZone,
          dates,
          numbers,
          labels: {
            invoice: (values) => t("overdue.invoiceNumber", values),
            ticket: ({ reference }) =>
              reference === null
                ? t("overdue.ticket")
                : t("overdue.ticketReference", { reference }),
          },
        })}
      />
    </FinanceSection>
  );
}
