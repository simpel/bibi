import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { ResponsibilityCreate } from "@/features/responsibility/ui/responsibility-create";
import { pageTitle } from "@/lib/page-metadata";

type NewResponsibilityPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewResponsibilityPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "responsibility", key: "create" });
}

export default async function NewResponsibilityPage({ params }: NewResponsibilityPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="responsibility:write">
        <ResponsibilityCreate locale={locale} />
      </PermissionGate>
    </SimplePage>
  );
}
