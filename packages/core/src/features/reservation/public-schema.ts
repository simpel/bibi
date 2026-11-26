import { z } from "zod";
import { PlainDateStringSchema } from "../../time/plain-date-schema";
import { ReservationRequirementSchema, ReservationStateSchema } from "./schema";

const Locale = z.enum(["sv", "en"]).default("sv");
const Texts = z.object({ sv: z.string().optional(), en: z.string().optional() });

/** The organization's published booking page as guests see it (ADR 0119). */
export const PublicBookingPageSchema = z.object({
  organizationName: z.string(),
  slug: z.string(),
  hasLogo: z.boolean(),
  hasCover: z.boolean(),
  accentColor: z.string().nullable(),
  intro: Texts,
  policy: Texts,
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  embedOrigins: z.array(z.string()),
  rooms: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      maxOnlineParty: z.number().int().describe("The largest party any sitting takes online"),
    }),
  ),
});

export const PublicPageInputSchema = z.object({ slug: z.string().min(1).max(60) });

export const PublicAvailabilityInputSchema = z.object({
  slug: z.string().min(1).max(60),
  roomSlug: z.string().min(1).max(60),
  date: PlainDateStringSchema,
  partySize: z.number().int().min(1).max(100),
});

export const PublicAvailabilityOutputSchema = z.object({
  timeZone: z.string(),
  slots: z.array(z.object({ startsAt: z.date(), endsAt: z.date(), serviceName: z.string() })),
});

const Booker = {
  bookerName: z.string().trim().min(1).max(120),
  bookerPhone: z.string().trim().min(5).max(40),
  bookerEmail: z.string().trim().email().max(200),
  note: z.string().trim().max(1000).nullable().optional(),
};

export const PublicCreateInputSchema = z.object({
  slug: z.string().min(1).max(60),
  roomSlug: z.string().min(1).max(60),
  startsAt: z.coerce.date(),
  partySize: z.number().int().min(1).max(100),
  ...Booker,
  requirements: z.array(ReservationRequirementSchema).max(30).optional(),
  locale: Locale,
  source: z.enum(["WEB", "API"]).default("WEB"),
});

/** What the guest sees of their reservation: never ids, tables or other guests. */
export const PublicReservationSchema = z.object({
  roomName: z.string(),
  pageSlug: z.string().nullable(),
  roomSlug: z.string().nullable(),
  startsAt: z.date(),
  endsAt: z.date(),
  timeZone: z.string(),
  partySize: z.number().int(),
  bookerName: z.string().nullable(),
  bookerPhone: z.string().nullable(),
  bookerEmail: z.string().nullable(),
  note: z.string().nullable(),
  state: ReservationStateSchema,
  canChange: z.boolean().describe("Before the change cutoff and still booked"),
  changeUntil: z.date().nullable(),
});

export const PublicCreateOutputSchema = z.object({
  token: z.string().describe("The manage token: the guest's key to change or cancel"),
  reservation: PublicReservationSchema,
});

export const PublicTokenInputSchema = z.object({ token: z.string().min(1).max(100) });

export const PublicChangeInputSchema = z.object({
  token: z.string().min(1).max(100),
  startsAt: z.coerce.date().optional(),
  partySize: z.number().int().min(1).max(100).optional(),
  bookerName: Booker.bookerName.optional(),
  bookerPhone: Booker.bookerPhone.optional(),
  bookerEmail: Booker.bookerEmail.optional(),
  note: Booker.note,
});

export const PublicCancelInputSchema = z.object({
  token: z.string().min(1).max(100),
  reason: z.string().trim().max(300).nullable().optional(),
});

export type PublicReservationDto = z.infer<typeof PublicReservationSchema>;
export type PublicBookingPageDto = z.infer<typeof PublicBookingPageSchema>;
