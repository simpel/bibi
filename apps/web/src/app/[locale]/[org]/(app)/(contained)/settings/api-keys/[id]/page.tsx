import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { apiKeyRoute } from "@/lib/routes";

type ApiKeyPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function SettingsApiKeyRedirect({ params }: ApiKeyPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: apiKeyRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
