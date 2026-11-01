import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { CustomerDetail } from "@/features/customer/ui/customer-detail";

type CustomerPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function CustomerPage({ params }: CustomerPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <CustomerDetail locale={locale} id={id} />
    </SimplePage>
  );
}
