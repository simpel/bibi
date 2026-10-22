import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { apiKeyRoute } from "@/lib/routes";

type ApiKeyPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function SettingsApiKeyRedirect({ params }: ApiKeyPageProps) {
  const { locale, id } = await params;
  redirect({ href: apiKeyRoute({ id }), locale: resolveLocale({ value: locale }) });
}
