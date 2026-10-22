import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@bibi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type ApiKeysPageProps = { params: Promise<{ locale: string }> };

export default async function SettingsApiKeysRedirect({ params }: ApiKeysPageProps) {
  const { locale } = await params;
  redirect({ href: ROUTES.adminApiKeys, locale: resolveLocale({ value: locale }) });
}
