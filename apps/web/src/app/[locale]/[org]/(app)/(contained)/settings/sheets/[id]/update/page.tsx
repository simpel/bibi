import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { SheetDefinitionUpdate } from "@/features/sheet-definition/ui/sheet-definition-update";

type UpdateSheetDefinitionPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateSheetDefinitionPage({
  params,
}: UpdateSheetDefinitionPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <SheetDefinitionUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
