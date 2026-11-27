import { organizationOfPage, organizationOfToken } from "@bibi/core";

/** What pins the guest's organization: the published page's slug or the reservation's token. */
export type GuestPin = { slug: string } | { token: string };

/**
 * The pinned organization's id, or null for an unknown slug or token. No `server-only` marker:
 * the proxy reads it too (frame-ancestors), and it is never imported by a client module.
 */
export async function organizationOfPin({ pin }: { pin: GuestPin }): Promise<string | null> {
  return "slug" in pin
    ? organizationOfPage({ slug: pin.slug })
    : organizationOfToken({ token: pin.token });
}
