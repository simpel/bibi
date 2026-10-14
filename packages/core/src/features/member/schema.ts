import { z } from "zod";
import { RoleNameSchema } from "../role/schema";

/** A staff member of the organization. Only what is needed to assign work; no other data. */
export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
  createdAt: z.date(),
});

export const MemberIdInputSchema = z.object({ id: z.string().min(1) });

export const MemberListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
  role: z.string().trim().min(1).optional().describe("Only members with this role name"),
});

export const MemberListOutputSchema = z.object({
  items: z.array(MemberSchema),
  nextCursor: z.string().nullable(),
});

export const MemberAssignRoleInputSchema = z.object({
  id: z.string().min(1).describe("Member id (from member.list)"),
  roles: z
    .array(RoleNameSchema)
    .min(1)
    .max(10)
    .describe("Role names that replace the member's current roles"),
});

export type MemberDto = z.infer<typeof MemberSchema>;
