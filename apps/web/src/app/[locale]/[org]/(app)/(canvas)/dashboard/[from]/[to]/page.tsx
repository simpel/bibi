import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type OldDashboardRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
};

/** The old `/dashboard/{from}/{to}` (ADR 0079): the dashboard has no period since ADR 0080. */
export default async function OldDashboardRoute({ params }: OldDashboardRouteProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.dashboard, locale: resolveLocale({ value: locale }), org });
}
