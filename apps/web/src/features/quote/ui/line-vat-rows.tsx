import type { OrderLineDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { lineVatBreakdown } from "./line-vat-breakdown";

export type LineVatRowsProps = { line: Pick<OrderLineDto, "vatRows"> };

/** One row per VAT rate of a bundle line (rate, base, VAT) and their sums; null for one rate. */
export function LineVatRows({ line }: LineVatRowsProps) {
  const t = useTranslations("quote");
  const { money } = useNumberFormat();
  const breakdown = lineVatBreakdown({ line });
  if (!breakdown) return null;
  return (
    <ul data-slot="line-vat-rows" className="mt-1 grid gap-0.5 text-xs text-muted-foreground">
      {breakdown.rows.map((row) => (
        <li key={row.vatRatePercent}>
          {t("lines.vatRow", {
            rate: row.vatRatePercent,
            base: money({ minor: row.totalExclVatMinor }),
            vat: money({ minor: row.vatMinor }),
          })}
        </li>
      ))}
      <li className="font-medium">
        {t("lines.vatRowsTotal", {
          base: money({ minor: breakdown.baseMinor }),
          vat: money({ minor: breakdown.vatMinor }),
        })}
      </li>
    </ul>
  );
}
