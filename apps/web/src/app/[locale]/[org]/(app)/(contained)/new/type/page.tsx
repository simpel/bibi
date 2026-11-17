import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { EntityTypeCreate } from "@/features/entity-type/ui/entity-type-create";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type NewTypePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ for?: string | string[] }>;
};

export async function generateMetadata({ params }: NewTypePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "entityType", key: "create" });
}

export default async function NewTypePage({ params, searchParams }: NewTypePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  const forItem = readCursor({ value: (await searchParams).for }) === "item";
  return (
    <SimplePage>
      <PermissionGate permission="configuration:write">
        <EntityTypeCreate forItem={forItem} />
      </PermissionGate>
    </SimplePage>
  );
}
