import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import {
  type RunSheetSearchParams,
  readRunSheetListParams,
} from "@/features/run-sheet/lib/list-params";
import { RunSheetList } from "@/features/run-sheet/ui/run-sheet-list";
import { pageTitle } from "@/lib/page-metadata";

type RunSheetsAllPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RunSheetSearchParams>;
};

export async function generateMetadata({ params }: RunSheetsAllPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "runSheets" });
}

export default async function RunSheetsAllPage({ params, searchParams }: RunSheetsAllPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="runSheet:read">
        <RunSheetList
          locale={locale}
          params={readRunSheetListParams({ params: await searchParams })}
        />
      </PermissionGate>
    </SimplePage>
  );
}
