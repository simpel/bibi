import type { LineDto } from "@bibi/core";
import type { ColumnDef } from "@bibi/ui";
import type { useTranslations } from "next-intl";
import { formatKr } from "../../item/ui/format-price";

type Translator = ReturnType<typeof useTranslations<"line">>;

export type AmountColumnsInput = { t: Translator; locale: string };

/** "(inherited)" after a value the line does not set itself (ADR 0052). */
const inherited = ({ t, source }: { t: Translator; source: string | null }) =>
  source && source !== "LINE" ? ` ${t("inherited")}` : "";

/** The effective quantity and unit price, each marked when inherited. */
export function amountColumns({ t, locale }: AmountColumnsInput): ColumnDef<LineDto>[] {
  return [
    {
      id: "quantity",
      header: t("columns.quantity"),
      accessorFn: (item) => item.effectiveQuantity ?? undefined,
      cell: ({ row: { original } }) =>
        original.effectiveQuantity === null
          ? "–"
          : `${original.effectiveQuantity}${inherited({ t, source: original.quantitySource })}`,
    },
    {
      id: "unitPrice",
      header: t("columns.unitPrice"),
      accessorFn: (item) => item.effectiveUnitPriceMinor ?? undefined,
      cell: ({ row: { original } }) =>
        original.effectiveUnitPriceMinor === null
          ? "–"
          : `${formatKr({ minor: original.effectiveUnitPriceMinor, locale })}${inherited({
              t,
              source: original.unitPriceSource,
            })}`,
    },
  ];
}
