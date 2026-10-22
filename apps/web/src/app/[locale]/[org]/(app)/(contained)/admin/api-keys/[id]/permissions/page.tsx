import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionPage } from "@/features/permission/ui/permission-page";

type ApiKeyPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function ApiKeyPermissionsPage({ params }: ApiKeyPermissionsPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <PermissionPage locale={locale} subjectType="apiKey" subjectId={id} />;
}
