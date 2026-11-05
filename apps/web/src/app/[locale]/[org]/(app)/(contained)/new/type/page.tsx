import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { EntityTypeCreate } from "@/features/entity-type/ui/entity-type-create";
import { pageTitle } from "@/lib/page-metadata";

type NewTypePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewTypePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "entityType", key: "create" });
}

export default async function NewTypePage({ params }: NewTypePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <PermissionGate permission="configuration:write">
        <EntityTypeCreate />
      </PermissionGate>
    </SimplePage>
  );
}
