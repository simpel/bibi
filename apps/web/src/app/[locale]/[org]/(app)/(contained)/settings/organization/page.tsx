import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { OrganizationSettings } from "@/features/organization-profile/ui/organization-settings";

type OrganizationPageProps = { params: Promise<{ locale: string }> };

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <OrganizationSettings locale={locale} />;
}
