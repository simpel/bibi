import type { DateTimeFormat, FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { overdueRows, vatRows } from "../lib/table-rows";
import { FinanceSection } from "./finance-section";
import { OverdueTable } from "./overdue-table";
import { VatTable } from "./vat-table";

export type FinanceTablesProps = {
  overview: FinanceOverviewDto;
  dates: DateTimeFormat;
  numbers: NumberFormat;
};

/** The overdue invoices and the VAT per rate. */
export function FinanceTables({ overview, dates, numbers }: FinanceTablesProps) {
  const t = useTranslations("finance");
  const { aging, vatByRate, currency, timeZone } = overview;
  return (
    <div data-slot="finance-tables" className="grid gap-4">
      <FinanceSection title={t("overdue.title")} data={aging?.overdue ?? null}>
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
      <FinanceSection title={t("vat.title")} data={vatByRate}>
        <VatTable rows={vatRows({ vatByRate: vatByRate ?? [], currency, numbers })} />
      </FinanceSection>
    </div>
  );
}
