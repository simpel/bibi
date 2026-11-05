import { z } from "zod";
import { HoursPatternShape, HoursSchema, refineHours } from "./schema";

const VenueIdShape = { venueId: z.string().min(1).describe("The venue") };
const ItemIdShape = { itemId: z.string().min(1).describe("The item, e.g. a person or a boat") };

export const VenueHoursGetInputSchema = z.object(VenueIdShape);

export const VenueHoursListInputSchema = z.object({
  venueIds: z
    .array(z.string().min(1))
    .min(1)
    .max(100)
    .describe("The venues (venue.list ids); unknown, archived or foreign ids are left out"),
});

export const VenueHoursListSchema = z.object({
  items: z
    .array(z.object({ venueId: z.string(), hours: HoursSchema }))
    .describe("One entry per active venue asked for, in the order given"),
});

export const VenueHoursSetInputSchema = z
  .object({ ...VenueIdShape, ...HoursPatternShape })
  .superRefine(({ days, exceptions }, ctx) => refineHours({ pattern: { days, exceptions }, ctx }));

export const ItemHoursGetInputSchema = z.object(ItemIdShape);

export const ItemHoursSetInputSchema = z
  .object({ ...ItemIdShape, ...HoursPatternShape })
  .superRefine(({ days, exceptions }, ctx) => refineHours({ pattern: { days, exceptions }, ctx }));

export type VenueHoursList = z.infer<typeof VenueHoursListSchema>;
export type VenueHoursSetInput = z.infer<typeof VenueHoursSetInputSchema>;
export type ItemHoursSetInput = z.infer<typeof ItemHoursSetInputSchema>;
