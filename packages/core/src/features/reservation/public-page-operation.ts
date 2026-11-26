import { getDb } from "@bibi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { toPageDto } from "../booking-page/operations";
import { PublicBookingPageSchema, PublicPageInputSchema } from "./public-schema";

/**
 * The published booking page as guests see it (ADR 0119): branding, texts and the dining rooms
 * that have a sitting. Run by the public page as SYSTEM after the slug pinned the organization.
 */
export const publicBookingPage = defineOperation({
  name: "bookingPage.publicGet",
  kind: "query",
  description: "The organization's published booking page for guests.",
  input: PublicPageInputSchema,
  output: PublicBookingPageSchema,
  permission: "diningSetup:read",
  systemOnly: true,
  approval: false,
  handler: async ({ context }) => {
    const row = await context.db.bookingPage.findFirst({ where: { published: true } });
    if (!row) return notFound({ entity: "Booking page" });
    const page = toPageDto({ row });
    const [organization, rooms, sittings] = await Promise.all([
      getDb().organization.findUnique({
        where: { id: context.organizationId },
        select: { name: true },
      }),
      context.db.diningRoom.findMany({
        select: { itemId: true, slug: true, item: { select: { name: true } } },
      }),
      context.db.diningService.findMany({ select: { roomItemId: true, maxOnlineParty: true } }),
    ]);
    const largest = new Map<string, number>();
    for (const s of sittings)
      largest.set(s.roomItemId, Math.max(largest.get(s.roomItemId) ?? 0, s.maxOnlineParty));
    return ok({
      value: {
        organizationName: organization?.name ?? "",
        slug: row.slug,
        hasLogo: page.logoKey !== null,
        hasCover: page.coverKey !== null,
        ...{ accentColor: page.accentColor, intro: page.intro, policy: page.policy },
        ...{
          contactPhone: page.contactPhone,
          contactEmail: page.contactEmail,
          embedOrigins: page.embedOrigins,
        },
        rooms: rooms
          .filter((room) => largest.has(room.itemId))
          .map((room) => ({
            slug: room.slug,
            name: room.item.name,
            maxOnlineParty: largest.get(room.itemId) ?? 0,
          })),
      },
    });
  },
});
