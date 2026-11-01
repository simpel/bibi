import type { FinanceOverviewDto, NumberFormat } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { vatRows } from "../lib/table-rows";
import { FinanceSection } from "./finance-section";
import { VatTable } from "./vat-table";

export type VatCardProps = {
  overview: Pick<FinanceOverviewDto, "vatByRate" | "currency">;
  numbers: NumberFormat;
};

/** Invoiced and output VAT per rate in the period. */
export function VatCard({ overview, numbers }: VatCardProps) {
  const t = useTranslations("finance");
  const { vatByRate, currency } = overview;
  return (
    <FinanceSection title={t("vat.title")} data={vatByRate} flush>
      <VatTable rows={vatRows({ vatByRate: vatByRate ?? [], currency, numbers })} />
    </FinanceSection>
  );
}
