import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { AccountingSettings } from "@/features/finance/ui/accounting-settings";

type AccountingPageProps = { params: Promise<{ locale: string }> };

export default async function AccountingPage({ params }: AccountingPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <AccountingSettings locale={locale} />
    </SimplePage>
  );
}
