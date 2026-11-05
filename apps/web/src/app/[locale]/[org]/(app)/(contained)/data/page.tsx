import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/routes";

type DashboardsStartProps = {
  params: Promise<{ locale: string; org: string }>;
  searchParams: Promise<{ customer?: string | string[] }>;
};

export async function generateMetadata({ params }: DashboardsStartProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "dashboard" });
}

/** Bare `/data`: server-side redirects to `/data/forecast`. */
export default async function DashboardsStart({ params, searchParams }: DashboardsStartProps) {
  const { locale: localeParam, org } = await params;
  const { customer } = await searchParams;
  const locale = resolveLocale({ value: localeParam });
  setRequestLocale(locale);

  const search =
    typeof customer === "string" && customer !== ""
      ? `?customer=${encodeURIComponent(customer)}`
      : "";
  redirect({ href: `${ROUTES.forecast}${search}`, locale, org });
}
