import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type MyWorkStartProps = { params: Promise<{ locale: string; org: string }> };

/** Bare `/my-work`: today is the start page. */
export default async function MyWorkStart({ params }: MyWorkStartProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.home, locale: resolveLocale({ value: locale }), org });
}
