import { z } from "zod";

export const VenueStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const VenueSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  streetAddress: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  openingHours: z.string().nullable(),
  defaultVatRatePercent: z.number().int(),
  status: VenueStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

export const VenueCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(200).describe("Venue name, e.g. World of Volvo"),
  description: z.string().trim().max(5000).nullish(),
  streetAddress: z.string().trim().max(200).nullish(),
  postalCode: z.string().trim().max(20).nullish(),
  city: z.string().trim().max(100).nullish(),
  country: z.string().length(2).toUpperCase().optional().describe("ISO 3166-1 alpha-2"),
  contactEmail: z.email().nullish(),
  contactPhone: z.string().trim().max(50).nullish(),
  openingHours: z.string().trim().max(500).nullish(),
  defaultVatRatePercent: z.number().int().min(0).max(100).optional(),
});

export const VenueUpdateInputSchema = VenueCreateInputSchema.partial().extend({
  id: z.string().min(1),
});

export const VenueIdInputSchema = z.object({ id: z.string().min(1) });

export const VenueListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const VenueListOutputSchema = z.object({
  items: z.array(VenueSchema),
  nextCursor: z.string().nullable(),
});

export type VenueDto = z.infer<typeof VenueSchema>;
export type VenueCreateInput = z.infer<typeof VenueCreateInputSchema>;
export type VenueUpdateInput = z.infer<typeof VenueUpdateInputSchema>;
