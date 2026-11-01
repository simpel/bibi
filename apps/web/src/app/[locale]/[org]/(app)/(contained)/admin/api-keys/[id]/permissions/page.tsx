import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionPage } from "@/features/permission/ui/permission-page";

type ApiKeyPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function ApiKeyPermissionsPage({ params }: ApiKeyPermissionsPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionPage locale={locale} subjectType="apiKey" subjectId={id} />
    </SimplePage>
  );
}
