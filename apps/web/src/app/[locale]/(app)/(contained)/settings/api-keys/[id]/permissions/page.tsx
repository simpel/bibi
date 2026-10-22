import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@bibi/i18n/navigation";
import { apiKeyPermissionsRoute } from "@/lib/routes";

type ApiKeyPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function SettingsApiKeyPermissionsRedirect({
  params,
}: ApiKeyPermissionsPageProps) {
  const { locale, id } = await params;
  redirect({ href: apiKeyPermissionsRoute({ id }), locale: resolveLocale({ value: locale }) });
}
