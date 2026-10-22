"use client";

import type { VenueWire } from "@bibi/ai";
import { Link } from "@bibi/i18n/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { venueRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type VenueCardViewProps = GenerativeProps<"venue-card">;

const addressOf = ({ venue }: { venue: VenueWire }): string =>
  [venue.streetAddress, [venue.postalCode, venue.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

/** One venue: name (link to its page), address, contact and status. */
export function VenueCardView({ venue }: VenueCardViewProps) {
  const t = useTranslations("assistant.ui");
  const common = useTranslations("common");
  const address = addressOf({ venue });
  const contact = venue.contactEmail ?? venue.contactPhone;
  return (
    <Card data-slot="venue-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={venueRoute({ id: venue.id })} className="hover:underline">
            {venue.name}
          </Link>
        </CardTitle>
        <Badge variant={venue.status === "ACTIVE" ? "success" : "secondary"}>
          {venue.status === "ACTIVE" ? common("active") : common("archived")}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {venue.description ? <p className="text-foreground">{venue.description}</p> : null}
        {address ? <p>{address}</p> : null}
        {contact ? <p>{contact}</p> : null}
        <Link href={venueRoute({ id: venue.id })} className="text-primary hover:underline">
          {t("open")}
        </Link>
      </CardContent>
    </Card>
  );
}
