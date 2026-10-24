import type { OrderLineDto } from "@bibi/core/schemas";
import { useLocale, useTranslations } from "next-intl";
import { formatKr } from "../../item/ui/format-price";
import { lineVatBreakdown } from "./line-vat-breakdown";

export type LineVatRowsProps = { line: Pick<OrderLineDto, "vatRows"> };

/** One row per VAT rate of a bundle line (rate, base, VAT) and their sums; null for one rate. */
export function LineVatRows({ line }: LineVatRowsProps) {
  const t = useTranslations("quote");
  const locale = useLocale();
  const breakdown = lineVatBreakdown({ line });
  if (!breakdown) return null;
  const kr = ({ minor }: { minor: number }) => t("amount", { amount: formatKr({ minor, locale }) });
  return (
    <ul data-slot="line-vat-rows" className="mt-1 grid gap-0.5 text-xs text-muted-foreground">
      {breakdown.rows.map((row) => (
        <li key={row.vatRatePercent}>
          {t("lines.vatRow", {
            rate: row.vatRatePercent,
            base: kr({ minor: row.totalExclVatMinor }),
            vat: kr({ minor: row.vatMinor }),
          })}
        </li>
      ))}
      <li className="font-medium">
        {t("lines.vatRowsTotal", {
          base: kr({ minor: breakdown.baseMinor }),
          vat: kr({ minor: breakdown.vatMinor }),
        })}
      </li>
    </ul>
  );
}
