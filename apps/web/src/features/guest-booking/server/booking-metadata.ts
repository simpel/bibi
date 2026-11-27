import "server-only";
import type { PublicBookingPageDto } from "@bibi/core/schemas";
import type { Metadata } from "next";
import { pageTitle } from "@/lib/page-metadata";

export type BookingMetadataInput = {
  locale: string;
  page: Pick<PublicBookingPageDto, "organizationName"> | null;
  /** The manage page's title instead of the booking page's. */
  manage?: boolean;
};

/**
 * Guest pages are never indexed and send no Referer (ADR 0119): the manage URL is the guest's
 * key, and the booking page's links must not leak it to the venue's or anyone's site.
 */
export async function bookingMetadata({
  locale,
  page,
  manage = false,
}: BookingMetadataInput): Promise<Metadata> {
  const named = page
    ? await pageTitle({
        locale,
        namespace: "guestBooking.meta",
        key: manage ? "manageTitle" : "title",
        values: { organization: page.organizationName },
      })
    : null;
  // White-label: the venue's title alone, without the app's " · Bibi" template.
  const title = typeof named?.title === "string" ? { title: { absolute: named.title } } : {};
  return { ...title, robots: { index: false, follow: false }, referrer: "no-referrer" };
}
