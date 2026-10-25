import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";

/** How a member's working time is planned in the organization (ADR 0068). */
export const SCHEDULE_KINDS = ["PATTERN", "SHIFTS", "CASUAL"] as const;

export const ScheduleKindSchema = z
  .enum(SCHEDULE_KINDS)
  .describe("PATTERN (weekly hours), SHIFTS (dated shifts only) or CASUAL (called in when needed)");

/** A linked staff item; its type is one of the person's positions. */
export const MemberProfileItemSchema = z.object({
  itemId: z.string(),
  name: z.string().describe("The staff item's name"),
  entityTypeId: z.string().describe("The item's type: the position (entityType.get)"),
});

/** A member's work in this organization (ADR 0068). */
export const MemberProfileSchema = z.object({
  id: z.string().nullable().describe("null until the profile is first saved"),
  memberId: z.string(),
  scheduleKind: ScheduleKindSchema,
  phone: z.string().nullable().describe("How colleagues here reach the member (ADR 0072)"),
  email: z.string().nullable().describe("Work email here; null means the login email"),
  avatarKey: z
    .string()
    .nullable()
    .describe("Photo shown here (file.get); prefilled from the member's own profile"),
  items: z
    .array(MemberProfileItemSchema)
    .describe("Active staff items linked to the member, by name; their types are the positions"),
});

const MemberIdShape = { memberId: z.string().min(1).describe("Id of the member (member.list)") };

export const MemberProfileGetInputSchema = z.object(MemberIdShape);

const IdListSchema = z.array(z.string().min(1)).min(1).max(100);

export const MemberProfileListInputSchema = z.object({
  ...PageInputShape,
  itemIds: IdListSchema.optional().describe("Only profiles linked to one of these staff items"),
  memberIds: IdListSchema.optional().describe("Only the profiles of these members"),
});

export const MemberProfileListOutputSchema = z.object({
  items: z.array(MemberProfileSchema),
  nextCursor: z.string().nullable(),
});

export const MemberProfileUpdateInputSchema = z.object({
  ...MemberIdShape,
  scheduleKind: ScheduleKindSchema.optional().describe("Omitted keeps the current kind"),
  phone: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .describe("Work phone here; null clears, omitted keeps"),
  email: z.email().max(254).nullish().describe("Work email here; null clears, omitted keeps"),
});

export const MemberProfileSetItemsInputSchema = z.object({
  ...MemberIdShape,
  itemIds: z
    .array(z.string().min(1))
    .max(20)
    .describe(
      "Replaces the linked staff items: active items whose type is PERSON, none linked to another member",
    ),
});

export type ScheduleKind = z.infer<typeof ScheduleKindSchema>;
export type MemberProfileDto = z.infer<typeof MemberProfileSchema>;
export type MemberProfileListInput = z.infer<typeof MemberProfileListInputSchema>;
export type MemberProfileSetItemsInput = z.infer<typeof MemberProfileSetItemsInputSchema>;
