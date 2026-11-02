import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type PaymentsPageProps = { params: Promise<{ locale: string; org: string }> };

/** The Stripe connection lives on Settings → Integrations (ADR 0090). */
export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.settingsIntegrations, locale: resolveLocale({ value: locale }), org });
}
