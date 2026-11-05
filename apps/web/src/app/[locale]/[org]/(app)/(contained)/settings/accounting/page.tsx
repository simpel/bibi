import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { AccountingSettings } from "@/features/finance/ui/accounting-settings";
import { pageTitle } from "@/lib/page-metadata";

type AccountingPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: AccountingPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "accounting" });
}

export default async function AccountingPage({ params }: AccountingPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <AccountingSettings locale={locale} />
    </SimplePage>
  );
}
