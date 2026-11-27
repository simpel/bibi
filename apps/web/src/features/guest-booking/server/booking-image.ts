import "server-only";
import { getBookingPage, getFileStore, organizationOfPage, runGuest } from "@bibi/core";
import type { BookingPageDto } from "@bibi/core/schemas";
import { withRequestLogging } from "@bibi/logger";
import { ensureOperations } from "@/server/operations";

export type BookingImageKind = "logo" | "cover";

const NOT_FOUND = () => new Response(null, { status: 404 });

/** The stored key of a published page's logo or cover, or null. */
async function imageKey({ slug, kind }: { slug: string; kind: BookingImageKind }) {
  const organizationId = await organizationOfPage({ slug });
  const result = await runGuest({ organizationId, operation: getBookingPage, input: {} });
  if (!result.ok) return null;
  const page = result.value as BookingPageDto;
  if (!page.published) return null;
  return kind === "logo" ? page.logoKey : page.coverKey;
}

/**
 * `GET /book/<slug>/logo` and `/cover` (ADR 0119): a published booking page's image for guests
 * and the booking mails, streamed from core's file store. Public, so it may be cached briefly.
 */
export function bookingImageHandler({ kind }: { kind: BookingImageKind }) {
  return withRequestLogging({
    surface: "web",
    handler: async (request) => {
      ensureOperations();
      const slug = decodeURIComponent(new URL(request.url).pathname.split("/")[2] ?? "");
      if (!slug) return NOT_FOUND();
      const key = await imageKey({ slug, kind });
      const store = getFileStore();
      if (!key || !store) return NOT_FOUND();
      const found = await store.get({ key });
      if (!found.ok || !found.value) return NOT_FOUND();
      return new Response(Buffer.from(found.value.body), {
        headers: {
          "content-type": found.value.contentType,
          "cache-control": "public, max-age=300",
          "x-content-type-options": "nosniff",
          // An uploaded SVG opened on its own must not run anything.
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        },
      });
    },
  });
}
