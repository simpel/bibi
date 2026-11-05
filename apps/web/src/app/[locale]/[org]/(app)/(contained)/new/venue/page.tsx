import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { VenueCreate } from "@/features/venue/ui/venue-create";
import { pageTitle } from "@/lib/page-metadata";

type NewVenuePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: NewVenuePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "venue", key: "create" });
}

export default async function NewVenuePage({ params }: NewVenuePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <PermissionGate permission="venue:write">
        <VenueCreate />
      </PermissionGate>
    </SimplePage>
  );
}
