import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SettingsHub } from "@/components/shell/settings-hub";

type SettingsPageProps = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: SettingsPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <SettingsHub />;
}
