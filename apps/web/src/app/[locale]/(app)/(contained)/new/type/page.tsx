import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { EntityTypeCreate } from "@/features/entity-type/ui/entity-type-create";

type NewTypePageProps = { params: Promise<{ locale: string }> };

export default async function NewTypePage({ params }: NewTypePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <PermissionGate permission="configuration:create">
      <EntityTypeCreate />
    </PermissionGate>
  );
}
