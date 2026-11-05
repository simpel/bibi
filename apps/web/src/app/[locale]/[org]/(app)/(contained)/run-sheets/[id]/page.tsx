import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadRunSheetDocument } from "@/features/run-sheet/load-run-sheet-document";
import { RunSheetDetail } from "@/features/run-sheet/ui/run-sheet-detail";
import { entityTitle } from "@/lib/page-metadata";

type RunSheetPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: RunSheetPageProps) {
  const { id } = await params;
  const loaded = await loadRunSheetDocument({ id });
  if (loaded.ok) {
    const label = loaded.value.name ?? "Run sheet";
    return entityTitle({ name: label, fallback: "Run sheet" });
  }
  return entityTitle({ fallback: "Run sheet" });
}

export default async function RunSheetPage({ params }: RunSheetPageProps) {
  const { locale: raw, id } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="runSheet:read">
        <RunSheetDetail locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
