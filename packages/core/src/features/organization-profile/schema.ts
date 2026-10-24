import { z } from "zod";
import { PhoneSchema } from "../../shared/phone";
import { TimeZoneSchema } from "../../time/time-zone";

/** Where the organization is in its first setup (ADR 0061). */
export const SETUP_STATUSES = ["PENDING", "COMPLETED", "SKIPPED"] as const;

export const SetupStatusSchema = z
  .enum(SETUP_STATUSES)
  .describe("PENDING until an admin activates (COMPLETED) or skips (SKIPPED) the first setup");

/** The organization's own facts (ADR 0061): setup status, legal and contact data, address. */
export const OrganizationProfileSchema = z.object({
  id: z.string().nullable().describe("null until the profile row exists"),
  setupStatus: SetupStatusSchema,
  legalName: z.string().nullable(),
  orgNumber: z.string().nullable(),
  streetAddress: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().describe("ISO 3166-1 alpha-2"),
  website: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  timeZone: z
    .string()
    .describe("IANA zone of ticket-level times and the default of every venue (ADR 0064)"),
});

export const OrganizationProfileGetInputSchema = z.object({});

const text = ({ max }: { max: number }) => z.string().trim().min(1).max(max).nullish();

export const OrganizationProfileUpdateInputSchema = z.object({
  legalName: text({ max: 200 }).describe("Registered company name"),
  orgNumber: text({ max: 40 }).describe("Organization number, e.g. 556000-0000"),
  streetAddress: text({ max: 200 }),
  postalCode: text({ max: 20 }),
  city: text({ max: 100 }),
  country: z.string().length(2).toUpperCase().optional().describe("ISO 3166-1 alpha-2"),
  website: z.url().max(300).nullish().describe("Website, e.g. https://example.se"),
  contactEmail: z.email().max(200).nullish(),
  contactPhone: PhoneSchema.nullish(),
  timeZone: TimeZoneSchema.optional().describe(
    "IANA zone, e.g. Europe/Stockholm: changes how times display and are entered, never a stored time",
  ),
});

export const OrganizationProfileSetSetupStatusInputSchema = z.object({
  setupStatus: SetupStatusSchema,
});

export type SetupStatus = z.infer<typeof SetupStatusSchema>;
export type OrganizationProfileDto = z.infer<typeof OrganizationProfileSchema>;
export type OrganizationProfileUpdateInput = z.infer<typeof OrganizationProfileUpdateInputSchema>;
