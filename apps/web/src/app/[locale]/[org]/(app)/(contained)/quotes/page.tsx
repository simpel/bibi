import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type QuotesIndexProps = { params: Promise<{ locale: string; org: string }> };

/** Quotes belong to orders; `/quotes` redirects to the orders list. */
export default async function QuotesIndex({ params }: QuotesIndexProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.orders, locale: resolveLocale({ value: locale }), org });
}
