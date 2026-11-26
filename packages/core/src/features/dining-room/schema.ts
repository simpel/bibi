import { z } from "zod";

/** Lowercase words joined by dashes, as in a web address (`kajen`, `terrassen-2`). */
export const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, digits and single dashes only");

/** A room set up for table booking (ADR 0119). */
export const DiningRoomSchema = z.object({
  id: z.string(),
  itemId: z.string().describe("The room item (item.get), an item with setups"),
  slug: z.string().describe("The room's part of the booking page address /book/<page>/<slug>"),
  openUntil: z
    .date()
    .nullable()
    .describe("Guests may book times that start before this instant; null = sittings' limits"),
});

export const DiningRoomListInputSchema = z.object({});

export const DiningRoomListOutputSchema = z.object({ items: z.array(DiningRoomSchema) });

export const DiningRoomGetInputSchema = z.object({ itemId: z.string().min(1) });

export const DiningRoomSetInputSchema = z.object({
  itemId: z.string().min(1).describe("The room item to set up for table booking"),
  slug: SlugSchema.describe("Unique among the organization's dining rooms"),
  openUntil: z.coerce
    .date()
    .nullable()
    .optional()
    .describe(
      "The instant bookings are open until (the end of the last open day in the room's zone); null = no limit beyond the sittings; omitted = unchanged",
    ),
});

export type DiningRoomDto = z.infer<typeof DiningRoomSchema>;
export type DiningRoomSetInput = z.infer<typeof DiningRoomSetInputSchema>;
