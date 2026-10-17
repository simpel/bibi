import type { Invitation } from "@okazi/db";
import { parseMemberRole } from "./member-roles";
import { type InvitationDto, InvitationStatusSchema } from "./schema";

/** Better Auth's default lifetime of an invitation (48 hours). */
export const INVITATION_TTL_MS = 48 * 60 * 60 * 1000;

export const INVITATION_SELECT = {
  id: true,
  organizationId: true,
  email: true,
  role: true,
  status: true,
  inviterId: true,
  expiresAt: true,
  createdAt: true,
} as const;

export type InvitationRow = Pick<Invitation, keyof typeof INVITATION_SELECT>;

export type ToInvitationDtoInput = { row: InvitationRow };

export function toInvitationDto({ row }: ToInvitationDtoInput): InvitationDto {
  const status = InvitationStatusSchema.safeParse(row.status);
  return {
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    role: parseMemberRole({ role: row.role }),
    status: status.success ? status.data : "canceled",
    inviterId: row.inviterId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}
