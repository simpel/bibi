import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { RunSheetDefinitionCreate } from "@/features/run-sheet-definition/ui/run-sheet-definition-create";
import { pageTitle } from "@/lib/page-metadata";

type NewRunSheetDefinitionPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewRunSheetDefinitionPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "runSheetDefinition", key: "create" });
}

export default async function NewRunSheetDefinitionPage({
  params,
}: NewRunSheetDefinitionPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="template:write">
        <RunSheetDefinitionCreate locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
