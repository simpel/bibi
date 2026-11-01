import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { VenueUpdate } from "@/features/venue/ui/venue-update";

type UpdateVenuePageProps = { params: Promise<{ locale: string; id: string }> };

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
