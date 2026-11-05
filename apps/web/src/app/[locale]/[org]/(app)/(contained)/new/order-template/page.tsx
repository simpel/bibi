import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { OrderTemplateCreate } from "@/features/order-template/ui/order-template-create";
import { pageTitle } from "@/lib/page-metadata";

type NewOrderTemplatePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewOrderTemplatePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "orderTemplate", key: "create" });
}

export default async function NewOrderTemplatePage({ params }: NewOrderTemplatePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <OrderTemplateCreate locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
