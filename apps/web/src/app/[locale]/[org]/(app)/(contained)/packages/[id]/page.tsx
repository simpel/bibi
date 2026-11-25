import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadOrderTemplate } from "@/features/order-template/load-order-template";
import { OrderTemplateDetail } from "@/features/order-template/ui/order-template-detail";
import { entityTitle } from "@/lib/page-metadata";

type OrderTemplatePageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: OrderTemplatePageProps) {
  const { id } = await params;
  const template = await loadOrderTemplate({ id });
  return entityTitle({ name: template.ok ? template.value.name : null, fallback: "Package" });
}

export default async function OrderTemplatePage({ params, searchParams }: OrderTemplatePageProps) {
  const [{ locale: rawLocale, id }, { tab }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <PermissionGate permission="orderTemplate:read">
      <OrderTemplateDetail locale={locale} id={id} tab={tab} />
    </PermissionGate>
  );
}
