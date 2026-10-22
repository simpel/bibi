import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { apiKeyUpdateRoute } from "@/lib/routes";

type UpdateApiKeyPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function SettingsApiKeyUpdateRedirect({ params }: UpdateApiKeyPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: apiKeyUpdateRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
