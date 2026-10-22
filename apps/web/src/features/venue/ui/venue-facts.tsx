import type { VenueDto } from "@bibi/core";
import { Card, CardContent } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

export type VenueFactsProps = { venue: VenueDto };

/** Read-only summary of address, contact and opening hours. */
export async function VenueFacts({ venue }: VenueFactsProps) {
  const t = await getTranslations("venue.fields");
  const address = [venue.streetAddress, [venue.postalCode, venue.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const facts = [
    { label: t("address"), value: address },
    { label: t("contactEmail"), value: venue.contactEmail },
    { label: t("contactPhone"), value: venue.contactPhone },
    { label: t("openingHours"), value: venue.openingHours },
  ].filter((fact) => fact.value);
  if (facts.length === 0) return null;
  return (
    <Card>
      <CardContent className="pt-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
