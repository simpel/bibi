import { PageContainer } from "@bibi/ui";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteActions } from "./site-actions";
import { getSitePlanText } from "./site-plan-text";
import { SiteSectionHeading } from "./site-section-heading";

const FACTS = ["trial", "seats", "extraSeats", "yearly"] as const;

export type SitePriceProps = { locale: string; appUrl: string };

/** The published price (ADR 0095): one plan, no sales call. Amounts come from Stripe. */
export async function SitePrice({ locale, appUrl }: SitePriceProps) {
  const [t, plan] = await Promise.all([getTranslations("site.price"), getSitePlanText()]);
  const { hasYearlyDiscount, ...values } = plan;
  const facts = FACTS.filter((fact) => fact !== "yearly" || hasYearlyDiscount);
  return (
    <section
      id="price"
      aria-labelledby="price-title"
      className="scroll-mt-20 border-t py-20 sm:py-28"
    >
      <PageContainer className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <SiteSectionHeading
          id="price-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />
        <div className="grid gap-6 rounded-2xl border bg-card p-6 shadow-lg sm:p-10">
          <p className="grid gap-1">
            <span className="font-serif text-5xl tabular-nums sm:text-6xl">
              {t("amount", values)}
            </span>
            <span className="text-muted-foreground">{t("unit")}</span>
          </p>
          <ul className="grid gap-3">
            {facts.map((fact) => (
              <li key={fact} className="flex gap-3">
                <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>{t(`facts.${fact}`, values)}</span>
              </li>
            ))}
          </ul>
          <SiteActions locale={locale} appUrl={appUrl} size="xl" />
        </div>
      </PageContainer>
    </section>
  );
}
