import { redirect } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type HomePageProps = { params: Promise<{ locale: string }> };

/** The app has no landing page yet: everyone goes to the venue list (guarded). */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  redirect({ href: ROUTES.venues, locale });
}
