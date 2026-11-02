import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { WorkOrderDefinitionUpdate } from "@/features/work-order-definition/ui/work-order-definition-update";

type UpdateWorkOrderDefinitionPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateWorkOrderDefinitionPage({
  params,
}: UpdateWorkOrderDefinitionPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <WorkOrderDefinitionUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
