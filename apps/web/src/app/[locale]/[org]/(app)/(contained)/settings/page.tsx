import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { SettingsHub } from "@/components/shell/settings-hub";
import { pageTitle } from "@/lib/page-metadata";

type SettingsPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: SettingsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "settings" });
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <SettingsHub />
    </SimplePage>
  );
}
