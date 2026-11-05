import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { loadVenue } from "@/features/venue/load-venue";
import { VenueUpdate } from "@/features/venue/ui/venue-update";
import { entityTitle } from "@/lib/page-metadata";

type UpdateVenuePageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: UpdateVenuePageProps) {
  const { id } = await params;
  const res = await loadVenue({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Venue",
    prefix: "Edit",
  });
}

export default async function UpdateVenuePage({ params }: UpdateVenuePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionGate permission="venue:write">
        <VenueUpdate locale={locale} id={id} />
      </PermissionGate>
    </SimplePage>
  );
}
