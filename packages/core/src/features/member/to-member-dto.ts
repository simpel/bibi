import type { Member } from "@okazi/db";
import { splitMemberRoles } from "./member-roles";
import type { MemberDto } from "./schema";

/** Selected with every member read, so the DTO never carries more user data than this. */
export const MEMBER_SELECT = {
  id: true,
  organizationId: true,
  userId: true,
  role: true,
  createdAt: true,
  user: { select: { name: true, email: true } },
} as const;

export type MemberRow = Pick<Member, "id" | "organizationId" | "userId" | "role" | "createdAt"> & {
  user: { name: string; email: string };
};

export type ToMemberDtoInput = { row: MemberRow };

export function toMemberDto({ row }: ToMemberDtoInput): MemberDto {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    roles: splitMemberRoles({ role: row.role }),
    createdAt: row.createdAt,
  };
}
