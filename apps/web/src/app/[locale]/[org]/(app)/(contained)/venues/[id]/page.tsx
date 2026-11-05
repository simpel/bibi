import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadVenue } from "@/features/venue/load-venue";
import { VenueDetail } from "@/features/venue/ui/venue-detail";
import { readCursor } from "@/lib/page-cursor";
import { entityTitle } from "@/lib/page-metadata";

type VenuePageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ itemCursor?: string | string[] }>;
};

export async function generateMetadata({ params }: VenuePageProps) {
  const { id } = await params;
  const res = await loadVenue({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Venue",
  });
}

export default async function VenuePage({ params, searchParams }: VenuePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { itemCursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <VenueDetail locale={locale} id={id} itemCursor={readCursor({ value: itemCursor })} />
    </SimplePage>
  );
}
