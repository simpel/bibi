import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadRunSheetDefinition } from "@/features/run-sheet-definition/load-run-sheet-definition";
import { RunSheetDefinitionUpdate } from "@/features/run-sheet-definition/ui/run-sheet-definition-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateRunSheetDefinitionPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateRunSheetDefinitionPageProps) {
  const { id } = await params;
  const def = await loadRunSheetDefinition({ id });
  return entityTitle({
    name: def.ok ? def.value.name : null,
    fallback: "Run sheet",
    prefix: "Edit",
  });
}

export default async function UpdateRunSheetDefinitionPage({
  params,
}: UpdateRunSheetDefinitionPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <RunSheetDefinitionUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
