import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadResponsibility } from "@/features/responsibility/load-responsibility";
import { ResponsibilityUpdate } from "@/features/responsibility/ui/responsibility-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateResponsibilityPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateResponsibilityPageProps) {
  const { id } = await params;
  const res = await loadResponsibility({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Responsibility",
    prefix: "Edit",
  });
}

export default async function UpdateResponsibilityPage({ params }: UpdateResponsibilityPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="responsibility:write">
        <ResponsibilityUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
