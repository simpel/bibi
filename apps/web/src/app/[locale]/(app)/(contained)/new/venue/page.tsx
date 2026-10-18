import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { VenueCreate } from "@/features/venue/ui/venue-create";

type NewVenuePageProps = { params: Promise<{ locale: string }> };

export default async function NewVenuePage({ params }: NewVenuePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <VenueCreate />;
}
