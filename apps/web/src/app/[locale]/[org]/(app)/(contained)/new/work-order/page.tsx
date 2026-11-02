import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { WorkOrderDefinitionCreate } from "@/features/work-order-definition/ui/work-order-definition-create";

type NewWorkOrderDefinitionPageProps = { params: Promise<{ locale: string }> };

export default async function NewWorkOrderDefinitionPage({
  params,
}: NewWorkOrderDefinitionPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <WorkOrderDefinitionCreate locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
