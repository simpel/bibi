import type { BillingConfigDto } from "@bibi/core";
import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { getNumberFormat } from "@/server/number-format";

export type PlanProductsProps = { config: BillingConfigDto };

/** What Bibi sells (ADR 0095), excluding VAT, and whether each price is in Stripe yet. */
export async function PlanProducts({ config }: PlanProductsProps) {
  const [t, numbers] = await Promise.all([
    getTranslations("admin.billing.products"),
    getNumberFormat(),
  ]);
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="text-base">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("description", { seats: config.includedSeats, days: config.trialDays })}
        </p>
      </div>
      <ul className="grid divide-y rounded-lg border">
        {config.products.map((product) => {
          const price = numbers.money({ minor: product.amountMinor, currency: product.currency });
          return (
            <li key={product.key} className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-sm">{t(`names.${product.key}`)}</span>
              <span className="text-sm tabular-nums">
                {t(product.interval === "YEAR" ? "perYear" : "perMonth", { price })}
              </span>
              <Badge variant={product.inStripe ? "success" : "secondary"}>
                {product.inStripe ? t("inStripe") : t("notInStripe")}
              </Badge>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
