import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ResponsibilityList } from "@/features/responsibility/ui/responsibility-list";
import { pageTitle } from "@/lib/page-metadata";

type ResponsibilitiesPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: ResponsibilitiesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "responsibilities" });
}

export default async function ResponsibilitiesPage({ params }: ResponsibilitiesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <ResponsibilityList locale={locale} inTab />;
}
