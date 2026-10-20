import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type ApiKeysPageProps = { params: Promise<{ locale: string }> };

/** The keys are listed on the integrations page; this path only serves the breadcrumb. */
export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
  const { locale } = await params;
  redirect({ href: ROUTES.settingsIntegrations, locale: resolveLocale({ value: locale }) });
}
