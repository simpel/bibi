import { Button, PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { OrderMockup } from "./mockups/order-mockup";
import { SiteActions } from "./site-actions";

export type SiteHeroProps = { locale: string; appUrl: string };

/** Centred headline over a soft glow, with the product window rising into the next section. */
export async function SiteHero({ locale, appUrl }: SiteHeroProps) {
  const t = await getTranslations("site");
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12rem] size-[38rem] -translate-x-[80%] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute left-1/2 top-[-8rem] size-[32rem] -translate-x-[10%] rounded-full bg-chart-3/20 blur-3xl" />
      </div>
      <PageContainer className="relative flex flex-col items-center gap-8 pt-32 text-center sm:pt-40">
        <h1 className="max-w-4xl text-balance text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          {t("heading")}
        </h1>
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          {t("lead")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SiteActions locale={locale} appUrl={appUrl} size="lg" />
          <Button asChild size="lg" variant="ghost">
            <a href="#how">{t("seeHow")}</a>
          </Button>
        </div>
        <div className="mt-8 w-full max-w-xl sm:mt-12">
          <OrderMockup />
        </div>
      </PageContainer>
    </section>
  );
}
