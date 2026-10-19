import { z } from "zod";

/** Where a user is in the first setup of an organization (ADR 0046). */
export const ONBOARDING_STATUSES = ["PENDING", "COMPLETED", "SKIPPED"] as const;

export const OnboardingStatusSchema = z
  .enum(ONBOARDING_STATUSES)
  .describe("PENDING until the user finishes (COMPLETED) or skips (SKIPPED) the first setup");

/** The caller's own settings (ADR 0046). */
export const UserSettingsSchema = z.object({
  id: z.string().nullable().describe("null when the user has no settings row yet"),
  onboardingStatus: OnboardingStatusSchema.nullable().describe(
    "null when the user was never asked to do the first setup, so nothing is pending",
  ),
  updatedAt: z.date().nullable(),
});

export const UserSettingsGetInputSchema = z.object({});

export const UserSettingsUpdateInputSchema = z.object({
  onboardingStatus: OnboardingStatusSchema,
});

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type UserSettingsDto = z.infer<typeof UserSettingsSchema>;
export type UserSettingsUpdateInput = z.infer<typeof UserSettingsUpdateInputSchema>;
