import { z } from "zod";
import { checkPostalCode } from "../../shared/postal-code";
import { TimeZoneSchema } from "../../time/time-zone";

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
  timeZone: z.string().nullable().describe("IANA zone; null = the organization's (ADR 0064)"),
  defaultVatRatePercent: z.number().int(),
  status: VenueStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

/** Venue fields without the cross-field rules; refined objects refuse `.partial`. */
const VenueFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200).describe("Venue name, e.g. World of Volvo"),
  description: z.string().trim().max(5000).nullish(),
  streetAddress: z.string().trim().max(200).nullish(),
  postalCode: z
    .string()
    .trim()
    .max(20)
    .nullish()
    .describe("Postal code in the country's format, e.g. 412 50 (SE)"),
  city: z.string().trim().max(100).nullish(),
  country: z.string().length(2).toUpperCase().optional().describe("ISO 3166-1 alpha-2"),
  contactEmail: z.email().nullish(),
  contactPhone: z.string().trim().max(50).nullish(),
  openingHours: z.string().trim().max(500).nullish(),
  timeZone: TimeZoneSchema.nullish().describe(
    "IANA zone of this venue's lines and calendar; null = the organization's zone",
  ),
  defaultVatRatePercent: z.number().int().min(0).max(100).optional(),
});

/** The postal code must match the country's format (`shared/postal-code.ts`). */
export const VenueCreateInputSchema = VenueFieldsSchema.superRefine((value, ctx) =>
  checkPostalCode({
    postalCode: value.postalCode,
    country: value.country,
    path: "postalCode",
    ctx,
  }),
);

export const VenueUpdateInputSchema = VenueFieldsSchema.partial()
  .extend({ id: z.string().min(1) })
  .superRefine((value, ctx) =>
    checkPostalCode({
      postalCode: value.postalCode,
      country: value.country,
      path: "postalCode",
      ctx,
    }),
  );

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
