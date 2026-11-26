import { z } from "zod";
import { SlugSchema } from "../dining-room/schema";

const LocaleTexts = z
  .object({
    sv: z.string().trim().max(2000).optional(),
    en: z.string().trim().max(2000).optional(),
  })
  .describe("Text per language: sv and en");

/** The organization's public booking page (ADR 0119), lightly white-labelled. */
export const BookingPageSchema = z.object({
  slug: z.string().nullable().describe("The page's part of /book/<slug>/<room>; null = not set up"),
  logoKey: z.string().nullable().describe("Read the logo with file.get"),
  coverKey: z.string().nullable().describe("Read the cover image with file.get"),
  accentColor: z.string().nullable().describe("#rrggbb; null = the default"),
  intro: LocaleTexts,
  policy: LocaleTexts,
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
  embedOrigins: z.array(z.string()).describe("Https origins allowed to embed the page"),
  published: z.boolean().describe("Guests see the page only when published"),
});

export const BookingPageGetInputSchema = z.object({});

const Origin = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value.replace(/\/$/, "");
  }, "An https origin such as https://example.com, with no path");

export const BookingPageUpdateInputSchema = z
  .object({
    slug: SlugSchema.describe("Unique across Bibi"),
    logoKey: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .nullable()
      .describe("Key from file.upload; null removes"),
    coverKey: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .nullable()
      .describe("Key from file.upload; null removes"),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "A colour as #rrggbb")
      .nullable()
      .describe("Refused when it has less than 4.5:1 contrast on white"),
    intro: LocaleTexts,
    policy: LocaleTexts,
    contactPhone: z.string().trim().max(40).nullable(),
    contactEmail: z.string().trim().email().max(200).nullable(),
    embedOrigins: z.array(Origin).max(10),
    published: z.boolean(),
  })
  .partial()
  .describe("Omitted fields are unchanged");

export type BookingPageDto = z.infer<typeof BookingPageSchema>;
export type BookingPageUpdateInput = z.infer<typeof BookingPageUpdateInputSchema>;
