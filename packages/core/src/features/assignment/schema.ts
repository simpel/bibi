import { z } from "zod";
import { PageInputShape } from "../../shared/page-input";
import { RecordStatusSchema } from "../../shared/record-status";

/** What can be assigned (ADR 0034): a ticket or an item (package or catalog item). */
export const ASSIGNMENT_SUBJECT_TYPES = ["TICKET", "ITEM"] as const;
export const AssignmentSubjectTypeSchema = z.enum(ASSIGNMENT_SUBJECT_TYPES);

/** `assignment.listMine`: what the member answers for, or what they follow. */
export const ASSIGNMENT_KINDS = ["ASSIGNED", "FOLLOWING"] as const;
export const AssignmentKindSchema = z.enum(ASSIGNMENT_KINDS);

export const AssignmentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  subjectType: AssignmentSubjectTypeSchema,
  subjectId: z.string(),
  responsibilityId: z
    .string()
    .nullable()
    .describe("The responsibility this assignment is for; null = the subject's main assignment"),
  assigneeId: z.string().nullable().describe("User id of the member who answers for it"),
  followerIds: z.array(z.string()).describe("User ids of the members who follow it"),
  status: RecordStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const SubjectShape = {
  subjectType: AssignmentSubjectTypeSchema.describe("What is assigned: TICKET or ITEM"),
  subjectId: z.string().min(1).describe("Id of the ticket or item"),
};

const ResponsibilityIdSchema = z
  .string()
  .min(1)
  .nullish()
  .describe(
    "Id of a responsibility (responsibility.list) for that part of a ticket; omitted or null " +
      "= the main assignment",
  );

export const AssignmentAssignInputSchema = z.object({
  ...SubjectShape,
  responsibilityId: ResponsibilityIdSchema,
  assigneeId: z
    .string()
    .min(1)
    .nullable()
    .describe("User id of the new assignee (member.list userId); null removes the assignee"),
});

export const AssignmentFollowInputSchema = z.object({
  ...SubjectShape,
  responsibilityId: ResponsibilityIdSchema,
  userId: z.string().min(1).describe("User id of the member (member.list userId)"),
});

export const AssignmentListInputSchema = z.object(SubjectShape);

export const AssignmentListOutputSchema = z.object({ items: z.array(AssignmentSchema) });

export const AssignmentListMineInputSchema = z.object({
  kind: AssignmentKindSchema.describe("ASSIGNED: what I answer for; FOLLOWING: what I follow"),
  subjectType: AssignmentSubjectTypeSchema.optional().describe("Only this kind of subject"),
  ...PageInputShape,
});

export const AssignmentListMineOutputSchema = z.object({
  items: z.array(AssignmentSchema),
  nextCursor: z.string().nullable(),
});

export type AssignmentSubjectType = z.infer<typeof AssignmentSubjectTypeSchema>;
export type AssignmentKind = z.infer<typeof AssignmentKindSchema>;
export type AssignmentDto = z.infer<typeof AssignmentSchema>;
export type AssignmentAssignInput = z.infer<typeof AssignmentAssignInputSchema>;
export type AssignmentFollowInput = z.infer<typeof AssignmentFollowInputSchema>;

/** One assignment slot: the subject plus the responsibility (null = main assignment). */
export type AssignmentSlot = {
  subjectType: AssignmentSubjectType;
  subjectId: string;
  responsibilityId?: string | null | undefined;
};
