import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadOrderTemplate } from "@/features/order-template/load-order-template";
import { OrderTemplateUpdate } from "@/features/order-template/ui/order-template-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateOrderTemplatePageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateOrderTemplatePageProps) {
  const { id } = await params;
  const tpl = await loadOrderTemplate({ id });
  return entityTitle({
    name: tpl.ok ? tpl.value.name : null,
    fallback: "Package",
    prefix: "Edit",
  });
}

export default async function UpdateOrderTemplatePage({ params }: UpdateOrderTemplatePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <OrderTemplateUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
