import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { SiteAudience } from "./site-audience";
import { SiteCta } from "./site-cta";
import { SiteFeatures } from "./site-features";
import { SiteHeader } from "./site-header";
import { SiteHero } from "./site-hero";
import { SiteIntegrations } from "./site-integrations";
import { SiteSteps } from "./site-steps";

type SitePageProps = { locale: string; appUrl: string };

/** The public front page, for everyone. It reads the session only to pick the buttons. */
export async function SitePage({ locale, appUrl }: SitePageProps) {
  const t = await getTranslations("site");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} appUrl={appUrl} />
      <main>
        <SiteHero locale={locale} appUrl={appUrl} />
        <SiteAudience />
        <SiteSteps />
        <SiteFeatures />
        <SiteIntegrations />
        <SiteCta locale={locale} appUrl={appUrl} />
      </main>
      <footer className="border-t py-6 text-sm text-muted-foreground">
        <PageContainer>{t("footer")}</PageContainer>
      </footer>
    </div>
  );
}
