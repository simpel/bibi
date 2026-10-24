import { effectiveTimeZone } from "@bibi/core/schemas";
import { useTimeZone } from "next-intl";

/**
 * The organization's zone in a client component: the request config sets it from the resolver
 * (ADR 0064), so this is the zone of ticket-level times and anything without a venue.
 */
export function useOrganizationTimeZone(): string {
  return useTimeZone() ?? effectiveTimeZone({});
}
