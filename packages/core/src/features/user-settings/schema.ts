import { z } from "zod";
import { CURRENCY_DISPLAYS, NUMBER_FORMATS } from "../../number/number-formats";
import { CLOCK_FORMATS, DATE_FORMATS } from "../../time/display-formats";

export const DateFormatSchema = z
  .enum(DATE_FORMATS)
  .describe(
    "How dates are written: D_MMM_YYYY = 27 Aug 2026, D_MMMM_YYYY = 27 August 2026, " +
      "YYYY_MM_DD = 2026-08-27, DD_MM_YYYY = 27/08/2026, MM_DD_YYYY = 08/27/2026",
  );

export const ClockFormatSchema = z.enum(CLOCK_FORMATS).describe("H24 = 14:30, H12 = 2:30 PM");

export const NumberFormatSchema = z
  .enum(NUMBER_FORMATS)
  .describe(
    "How numbers and amounts are written: SPACE_COMMA = 1 234,50, COMMA_DOT = 1,234.50, " +
      "DOT_COMMA = 1.234,50, SPACE_DOT = 1 234.50",
  );

export const CurrencyDisplaySchema = z
  .enum(CURRENCY_DISPLAYS)
  .describe("SYMBOL = 1 234,50 kr, CODE = 1 234,50 SEK; the position follows the UI language");

/** The caller's own settings (ADR 0046): typed, one row per user, shared across organizations. */
export const UserSettingsSchema = z.object({
  id: z.string().nullable().describe("null when the user has no settings row yet"),
  dateFormat: DateFormatSchema.nullable().describe("null = the default, D_MMM_YYYY"),
  clockFormat: ClockFormatSchema.nullable().describe("null = the default, H24"),
  numberFormat: NumberFormatSchema.nullable().describe("null = the UI language's style"),
  currencyDisplay: CurrencyDisplaySchema.nullable().describe("null = the default, SYMBOL"),
  updatedAt: z.date().nullable(),
});

export const UserSettingsGetInputSchema = z.object({});

export const UserSettingsUpdateInputSchema = z.object({
  dateFormat: DateFormatSchema.nullish().describe("null resets to the default; omitted keeps it"),
  clockFormat: ClockFormatSchema.nullish().describe("null resets to the default; omitted keeps it"),
  numberFormat: NumberFormatSchema.nullish().describe(
    "null resets to the default; omitted keeps it",
  ),
  currencyDisplay: CurrencyDisplaySchema.nullish().describe(
    "null resets to the default; omitted keeps it",
  ),
});

export type UserSettingsDto = z.infer<typeof UserSettingsSchema>;
export type UserSettingsUpdateInput = z.infer<typeof UserSettingsUpdateInputSchema>;
