import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@bibi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type IntegrationsPageProps = { params: Promise<{ locale: string }> };

export default async function SettingsIntegrationsRedirect({ params }: IntegrationsPageProps) {
  const { locale } = await params;
  redirect({ href: ROUTES.adminApiKeys, locale: resolveLocale({ value: locale }) });
}
