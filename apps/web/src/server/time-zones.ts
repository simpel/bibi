import "server-only";
import { effectiveTimeZone, getOrganizationProfile, listItems } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "./run-operation";

/** Not signed in, or no active organization (`resolveExecuteContext`): nothing org-owned shows. */
const NO_ORGANIZATION = new Set(["UNAUTHENTICATED", "FORBIDDEN"]);

/**
 * The active organization's zone through the resolver (ADR 0064), once per request. Every member
 * can read it: `configuration:read` is shared vocabulary and cannot be denied (ADR 0050), so a
 * refusal only means there is no organization (sign-in and `/welcome/new`, which show no stored
 * times) and gets the resolver's fallback. Any other error is thrown: no time is ever shown or
 * entered in a guessed zone.
 */
export const loadOrganizationTimeZone = cache(async (): Promise<string> => {
  const profile = await runOperation({ operation: getOrganizationProfile, input: {} });
  if (profile.ok) return effectiveTimeZone({ organization: profile.value });
  if (NO_ORGANIZATION.has(profile.error.code)) return effectiveTimeZone({});
  throw profile.error;
});

/**
 * The zone of one venue's times, from its items: core derives each item's zone, so `venue:read`
 * is not needed. A venue without readable items has no times to show, so its calendar is
 * labelled in the organization's zone.
 */
export async function loadVenueTimeZone({ venueId }: { venueId: string }): Promise<string> {
  const items = await runOperation({ operation: listItems, input: { venueId, limit: 1 } });
  const zone = items.ok ? items.value.items[0]?.timeZone : undefined;
  return zone ?? loadOrganizationTimeZone();
}
