import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { SiteActions } from "./site-actions";

export type SiteCtaProps = { locale: string; appUrl: string };

/** Closing call to action on a dark band (inverts with the theme). */
export async function SiteCta({ locale, appUrl }: SiteCtaProps) {
  const t = await getTranslations("site.cta");
  return (
    <section className="px-4 pb-20 sm:pb-28">
      <PageContainer className="grid justify-items-center gap-6 rounded-3xl bg-foreground px-6 py-16 text-center text-background sm:py-24">
        <h2 className="max-w-2xl text-balance text-4xl text-background sm:text-5xl">
          {t("title")}
        </h2>
        <p className="max-w-xl text-pretty text-lg text-background/70">{t("body")}</p>
        <SiteActions locale={locale} appUrl={appUrl} size="lg" tone="inverse" />
      </PageContainer>
    </section>
  );
}
