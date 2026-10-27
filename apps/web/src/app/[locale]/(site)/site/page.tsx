import { getEnv } from "@bibi/config";
import { resolveLocale } from "@bibi/i18n";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SitePage } from "@/features/site/ui/site-page";

type SiteRouteProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: SiteRouteProps): Promise<Metadata> {
  const { PUBLIC_URL } = getEnv();
  const locale = resolveLocale({ value: (await params).locale });
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...(PUBLIC_URL
      ? { metadataBase: new URL(PUBLIC_URL), alternates: { canonical: `/${locale}` } }
      : {}),
  };
}

/** The public front page (ADR 0073): the apex rewrites `/`, `/sv` and `/en` here. No session is read. */
export default async function SiteRoute({ params }: SiteRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const appUrl = new URL(getEnv().WEB_URL).origin;
  return <SitePage locale={locale} appUrl={appUrl} />;
}
