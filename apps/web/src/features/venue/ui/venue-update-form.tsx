"use client";

import type { VenueDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { venueRoute } from "@/lib/routes";
import { VenueForm } from "./venue-form";

export type VenueUpdateFormProps = { venue: VenueDto };

/** The venue form on its update page; saving (or cancelling) goes back to the venue. */
export function VenueUpdateForm({ venue }: VenueUpdateFormProps) {
  const router = useRouter();
  return (
    <div className="max-w-2xl">
      <VenueForm venue={venue} onDone={() => router.push(venueRoute({ id: venue.id }))} />
    </div>
  );
}
