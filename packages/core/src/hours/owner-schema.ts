import { z } from "zod";
import { HoursPatternShape, refineHours } from "./schema";

const VenueIdShape = { venueId: z.string().min(1).describe("The venue") };
const ItemIdShape = { itemId: z.string().min(1).describe("The item, e.g. a person or a boat") };

export const VenueHoursGetInputSchema = z.object(VenueIdShape);

export const VenueHoursSetInputSchema = z
  .object({ ...VenueIdShape, ...HoursPatternShape })
  .superRefine(({ days, exceptions }, ctx) => refineHours({ pattern: { days, exceptions }, ctx }));

export const ItemHoursGetInputSchema = z.object(ItemIdShape);

export const ItemHoursSetInputSchema = z
  .object({ ...ItemIdShape, ...HoursPatternShape })
  .superRefine(({ days, exceptions }, ctx) => refineHours({ pattern: { days, exceptions }, ctx }));

export type VenueHoursSetInput = z.infer<typeof VenueHoursSetInputSchema>;
export type ItemHoursSetInput = z.infer<typeof ItemHoursSetInputSchema>;
