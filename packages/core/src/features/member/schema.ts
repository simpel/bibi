import { z } from "zod";
import { FixedRoleSchema } from "../../permissions/fixed-roles";

/** A staff member of the organization. Only what is needed to assign work; no other data. */
export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  /** `null` when the stored role is not a fixed role; such a member can do nothing. */
  role: FixedRoleSchema.nullable(),
  createdAt: z.date(),
});

export const MemberIdInputSchema = z.object({ id: z.string().min(1) });

export const MemberListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
  role: FixedRoleSchema.optional().describe("Only members with this role"),
});

export const MemberListOutputSchema = z.object({
  items: z.array(MemberSchema),
  nextCursor: z.string().nullable(),
});

export const MemberAssignRoleInputSchema = z.object({
  id: z.string().min(1).describe("Member id (from member.list)"),
  role: FixedRoleSchema.describe(
    "The member's new role: member, manager or admin (never above your own)",
  ),
});

export type MemberDto = z.infer<typeof MemberSchema>;

export const MemberRemoveInputSchema = z.object({
  id: z.string().min(1).describe("Member id (from member.list)"),
});

/** Better Auth's invitation states; only `pending` invitations can be accepted or cancelled. */
export const InvitationStatusSchema = z.enum(["pending", "accepted", "rejected", "canceled"]);

/** An invitation to join the organization as staff, with the role the invitee will get. */
export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: FixedRoleSchema.nullable(),
  status: InvitationStatusSchema,
  inviterId: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export const MemberInviteInputSchema = z.object({
  email: z
    .email()
    .max(254)
    .describe("Email address of the person to invite; they accept with this address"),
  role: FixedRoleSchema.describe(
    "The role the invitee gets when they accept: member, manager or admin (never above yours)",
  ),
});

export const InvitationIdInputSchema = z.object({
  id: z.string().min(1).describe("Invitation id (from member.listInvitations)"),
});

export const InvitationListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const InvitationListOutputSchema = z.object({
  items: z.array(InvitationSchema),
  nextCursor: z.string().nullable(),
});

export type InvitationDto = z.infer<typeof InvitationSchema>;
