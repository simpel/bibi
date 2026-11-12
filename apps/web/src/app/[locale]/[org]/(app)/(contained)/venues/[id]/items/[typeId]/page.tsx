import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { VenueItems } from "@/features/item/ui/venue-items";
import { loadVenue } from "@/features/venue/load-venue";
import { entityTitle } from "@/lib/page-metadata";

type VenueTypeItemsPageProps = {
  params: Promise<{ locale: string; id: string; typeId: string }>;
};

export async function generateMetadata({ params }: VenueTypeItemsPageProps) {
  const { id } = await params;
  const res = await loadVenue({ id });
  return entityTitle({ name: res.ok ? res.value.name : null, fallback: "Venue", prefix: "Items" });
}

export default async function VenueTypeItemsPage({ params }: VenueTypeItemsPageProps) {
  const { locale: rawLocale, id, typeId } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <VenueItems locale={locale} venueId={id} typeId={typeId} />
    </SimplePage>
  );
}
