import { z } from "zod";
import { FixedRoleSchema } from "../../permissions/fixed-roles";
import { PermissionOverrideSchema } from "../../permissions/overrides";
import { PermissionSetSchema } from "../../permissions/permission-set";

export const PERMISSION_SUBJECTS = ["member", "apiKey"] as const;
export type PermissionSubjectType = (typeof PERMISSION_SUBJECTS)[number];

export const PermissionSubjectInputSchema = z.object({
  subjectType: z.enum(PERMISSION_SUBJECTS).describe("Whose permissions: a member or an API key"),
  subjectId: z.string().min(1).describe("Member id (member.list) or API key id (apiKey.list)"),
});

/** A member's or API key's permissions (ADR 0050): preset, overrides and the result. */
export const PermissionProfileSchema = z.object({
  subjectType: z.enum(PERMISSION_SUBJECTS),
  subjectId: z.string(),
  /** `null` when the stored role is not a preset; such a subject can do nothing. */
  preset: FixedRoleSchema.nullable(),
  overrides: z.array(PermissionOverrideSchema),
  effective: PermissionSetSchema.describe("Preset plus allow, minus deny"),
});

export const PermissionUpdateInputSchema = PermissionSubjectInputSchema.extend({
  overrides: z
    .array(PermissionOverrideSchema)
    .max(200)
    .describe(
      "The complete set of overrides; anything left out goes back to the preset. Locked " +
        "admin-only permissions (member, apiKey, paymentAccount except view) are refused.",
    ),
});

export type PermissionProfile = z.infer<typeof PermissionProfileSchema>;
export type PermissionSubjectInput = z.infer<typeof PermissionSubjectInputSchema>;
export type PermissionUpdateInput = z.infer<typeof PermissionUpdateInputSchema>;
