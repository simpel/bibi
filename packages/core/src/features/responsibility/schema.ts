import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

export const ResponsibilitySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  entityTypeIds: z.array(z.string()).describe("Item types this responsibility covers"),
  defaultAssigneeId: z.string().describe("User id of the member who answers for it by default"),
  defaultFollowerIds: z.array(z.string()).describe("User ids of members who follow it by default"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const NameSchema = z.string().trim().min(1).max(100);
const IdsSchema = z.array(z.string().min(1)).max(100);

export const ResponsibilityCreateInputSchema = z.object({
  name: NameSchema.describe("What someone answers for, e.g. Head of kitchen or Head of exhibits"),
  entityTypeIds: IdsSchema.default([]).describe(
    "Ids of item types (entityType.list, base ITEM) this responsibility covers",
  ),
  defaultAssigneeId: z
    .string()
    .min(1)
    .describe("User id (member.list, userId) of the default assignee, who must be a member"),
  defaultFollowerIds: IdsSchema.default([]).describe(
    "User ids (member.list, userId) of members who follow by default",
  ),
});

export const ResponsibilityUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: NameSchema.optional(),
  entityTypeIds: IdsSchema.optional().describe("Replaces the covered item types"),
  defaultAssigneeId: z.string().min(1).optional().describe("The new default assignee"),
  defaultFollowerIds: IdsSchema.optional().describe("Replaces the default followers"),
});

export const ResponsibilityIdInputSchema = z.object({ id: z.string().min(1) });

export const ResponsibilityListInputSchema = z.object(PageInputShape);

export const ResponsibilityListOutputSchema = z.object({
  items: z.array(ResponsibilitySchema),
  nextCursor: z.string().nullable(),
});

export type ResponsibilityDto = z.infer<typeof ResponsibilitySchema>;
export type ResponsibilityCreateInput = z.infer<typeof ResponsibilityCreateInputSchema>;
export type ResponsibilityUpdateInput = z.infer<typeof ResponsibilityUpdateInputSchema>;

/** What a responsibility covers and who it defaults to: checked together by `checkResponsibility`. */
export type ResponsibilityContents = Pick<
  ResponsibilityDto,
  "entityTypeIds" | "defaultAssigneeId" | "defaultFollowerIds"
>;
