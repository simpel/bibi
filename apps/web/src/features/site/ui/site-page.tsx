import { Button, PageContainer, Wordmark } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { SiteFeatures } from "./site-features";

type SitePageProps = { locale: string; appUrl: string };

/** The public front page. Log in and sign up leave for the app host, which owns the session. */
export async function SitePage({ locale, appUrl }: SitePageProps) {
  const t = await getTranslations("site");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <PageContainer className="flex items-center justify-between py-4">
          <Wordmark size="md" aria-label={t("brand")} />
          <Button asChild variant="ghost">
            <a href={`${appUrl}/${locale}/login`}>{t("login")}</a>
          </Button>
        </PageContainer>
      </header>
      <main>
        <PageContainer className="flex flex-col items-start gap-6 py-20">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("lead")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={`${appUrl}/${locale}/sign-up`}>{t("signUp")}</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`${appUrl}/${locale}/login`}>{t("login")}</a>
            </Button>
          </div>
        </PageContainer>
        <SiteFeatures />
      </main>
      <footer className="border-t py-6 text-sm text-muted-foreground">
        <PageContainer>{t("footer")}</PageContainer>
      </footer>
    </div>
  );
}
