import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type ApiKeysPageProps = { params: Promise<{ locale: string; org: string }> };

export default async function SettingsApiKeysRedirect({ params }: ApiKeysPageProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.adminApiKeys, locale: resolveLocale({ value: locale }), org });
}
