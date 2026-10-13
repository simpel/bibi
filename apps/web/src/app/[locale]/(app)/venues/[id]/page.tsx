import { setRequestLocale } from "next-intl/server";
import { VenueDetail } from "@/features/venue/ui/venue-detail";
import { readCursor } from "@/lib/page-cursor";

type VenuePageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ roomCursor?: string | string[] }>;
};

export default async function VenuePage({ params, searchParams }: VenuePageProps) {
  const { locale, id } = await params;
  const { roomCursor } = await searchParams;
  setRequestLocale(locale);
  return <VenueDetail locale={locale} id={id} roomCursor={readCursor({ value: roomCursor })} />;
}
