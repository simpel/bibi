import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { apiKeyPermissionsRoute } from "@/lib/routes";

type ApiKeyPermissionsPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function SettingsApiKeyPermissionsRedirect({
  params,
}: ApiKeyPermissionsPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: apiKeyPermissionsRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
