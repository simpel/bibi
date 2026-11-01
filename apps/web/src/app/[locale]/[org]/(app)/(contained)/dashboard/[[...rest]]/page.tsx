import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type OldDashboardRouteProps = {
  params: Promise<{ locale: string; org: string; rest?: string[] }>;
  searchParams: Promise<{ customer?: string | string[] }>;
};

/** The old `/dashboard/...` paths: the same dashboard and range under `/data` (ADR 0086). */
export default async function OldDashboardRoute({ params, searchParams }: OldDashboardRouteProps) {
  const { locale, org, rest = [] } = await params;
  const { customer } = await searchParams;
  const query =
    typeof customer === "string" && customer ? `?customer=${encodeURIComponent(customer)}` : "";
  const path = [ROUTES.dashboard, ...rest.map(encodeURIComponent)].join("/");
  redirect({ href: `${path}${query}`, locale: resolveLocale({ value: locale }), org });
}
