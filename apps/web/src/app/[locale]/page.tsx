import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type HomePageProps = { params: Promise<{ locale: string }> };

/** The app has no landing page yet: everyone goes to the venue list (guarded). */
export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  redirect({ href: ROUTES.venues, locale });
}
