import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { apiKeyUpdateRoute } from "@/lib/routes";

type UpdateApiKeyPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function SettingsApiKeyUpdateRedirect({ params }: UpdateApiKeyPageProps) {
  const { locale, id } = await params;
  redirect({ href: apiKeyUpdateRoute({ id }), locale: resolveLocale({ value: locale }) });
}
