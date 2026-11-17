import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { OrderTemplateList } from "@/features/order-template/ui/order-template-list";
import { pageTitle } from "@/lib/page-metadata";

type PackagesPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PackagesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "orderTemplates" });
}

export default async function PackagesPage({ params }: PackagesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <OrderTemplateList locale={locale} />
    </SimplePage>
  );
}
