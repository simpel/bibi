import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SetupList } from "@/features/setup/ui/setup-list";
import { pageTitle } from "@/lib/page-metadata";

type SetupsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: SetupsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "setups" });
}

export default async function SetupsPage({ params }: SetupsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <SetupList locale={locale} inTab />;
}
