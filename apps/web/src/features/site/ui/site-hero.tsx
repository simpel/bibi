import { Button, PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { DayMockup } from "./mockups/day-mockup";
import { SiteActions } from "./site-actions";
import { getSitePlanText } from "./site-plan-text";

export type SiteHeroProps = { locale: string; appUrl: string };

/** The thesis: meetings, food and the restaurant's tables in one system, shown as one day. */
export async function SiteHero({ locale, appUrl }: SiteHeroProps) {
  const [t, plan] = await Promise.all([getTranslations("site.hero"), getSitePlanText()]);
  return (
    <section aria-labelledby="hero-title" className="border-b bg-muted/40">
      <PageContainer className="grid gap-12 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="grid max-w-3xl gap-6">
          <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
          <h1
            id="hero-title"
            className="text-balance text-5xl leading-[1.05] sm:text-6xl lg:text-7xl"
          >
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            {t("lead")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SiteActions locale={locale} appUrl={appUrl} size="xl" />
            <Button asChild size="lg" variant="ghost">
              <a href="#price">{t("seePrice")}</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("trialNote", { trialDays: plan.trialDays, amount: plan.amount })}
          </p>
        </div>
        <DayMockup />
      </PageContainer>
    </section>
  );
}
