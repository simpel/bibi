import { PageContainer } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { SiteCta } from "./site-cta";
import { SiteFeatures } from "./site-features";
import { SiteHeader } from "./site-header";
import { SiteHero } from "./site-hero";
import { SitePrice } from "./site-price";

type SitePageProps = { locale: string; appUrl: string };

/**
 * The public front page, for everyone. It reads the session only to pick the buttons.
 * Story: one system (hero) → four messages (meetings, the restaurant, own lists, the assistant)
 * → price → start.
 */
export async function SitePage({ locale, appUrl }: SitePageProps) {
  const t = await getTranslations("site");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader locale={locale} appUrl={appUrl} />
      <main>
        <SiteHero locale={locale} appUrl={appUrl} />
        <SiteFeatures />
        <SitePrice locale={locale} appUrl={appUrl} />
        <SiteCta locale={locale} appUrl={appUrl} />
      </main>
      <footer className="border-t py-6 text-sm text-muted-foreground">
        <PageContainer className="flex flex-wrap items-center justify-between gap-4">
          <span>{t("footer")}</span>
          <nav className="flex gap-6">
            <Link href="/support" className="hover:text-foreground">
              {t("supportLink")}
            </Link>
            <Link href="/developers" className="hover:text-foreground">
              {t("developersLink")}
            </Link>
          </nav>
        </PageContainer>
      </footer>
    </div>
  );
}
