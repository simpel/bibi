import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { VenueUpdate } from "@/features/venue/ui/venue-update";

type UpdateVenuePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateVenuePage({ params }: UpdateVenuePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <VenueUpdate locale={locale} id={id} />;
}
