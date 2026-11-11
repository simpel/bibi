import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type PageProps = { params: Promise<{ locale: string; org: string }> };

/** Setups are gone (ADR 0103): rooms have layouts. The old address opens the types page. */
export default async function OldListRedirect({ params }: PageProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.adminTypes, locale: resolveLocale({ value: locale }), org });
}
