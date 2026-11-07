import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { OrganizationSettings } from "@/features/organization-profile/ui/organization-settings";
import { pageTitle } from "@/lib/page-metadata";

type OrganizationPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "organization" });
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <OrganizationSettings locale={locale} />
    </SimplePage>
  );
}
