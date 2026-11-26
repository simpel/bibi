import { resolveLocale } from "@bibi/i18n";
import { dayRoute } from "@/features/reservation/lib/routes";
import { redirect } from "@/lib/navigation";

type PageProps = {
  params: Promise<{ locale: string; org: string; date: string }>;
  searchParams: Promise<{ room?: string }>;
};

/** The floor is part of the day view now: the old address opens it. */
export default async function ReservationFloorRedirect({ params, searchParams }: PageProps) {
  const { locale, org, date } = await params;
  const { room } = await searchParams;
  redirect({ href: dayRoute({ date, room }), locale: resolveLocale({ value: locale }), org });
}
