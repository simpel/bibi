import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { VenueDetail } from "@/features/venue/ui/venue-detail";
import { readCursor } from "@/lib/page-cursor";

type VenuePageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ itemCursor?: string | string[] }>;
};

export default async function VenuePage({ params, searchParams }: VenuePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { itemCursor } = await searchParams;
  setRequestLocale(locale);
  return <VenueDetail locale={locale} id={id} itemCursor={readCursor({ value: itemCursor })} />;
}
