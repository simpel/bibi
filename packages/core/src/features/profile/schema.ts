import { z } from "zod";
import { PhoneSchema } from "../../shared/phone";

const NameSchema = z.string().trim().min(1).max(80);

/** The caller's own profile (ADR 0061): one per user, shared across organizations. */
export const ProfileSchema = z.object({
  id: z.string().nullable().describe("null until the user saves a profile"),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  avatarKey: z.string().nullable().describe("Storage key of the avatar from file.upload"),
  complete: z.boolean().describe("First name, last name and phone are set and working hours exist"),
});

export const ProfileGetInputSchema = z.object({});

export const ProfileUpdateInputSchema = z.object({
  firstName: NameSchema.describe("First name, 1–80 characters"),
  lastName: NameSchema.describe("Last name, 1–80 characters"),
  phone: PhoneSchema,
  avatarKey: z
    .string()
    .trim()
    .min(1)
    .max(512)
    .nullish()
    .describe("Key returned by file.upload; null removes the avatar, omitted keeps it"),
});

export type ProfileDto = z.infer<typeof ProfileSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateInputSchema>;
