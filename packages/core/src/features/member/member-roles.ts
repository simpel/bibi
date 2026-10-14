export type SplitMemberRolesInput = { role: string };

/** Better Auth stores a member's roles comma-separated in `member.role`. */
export function splitMemberRoles({ role }: SplitMemberRolesInput): string[] {
  return role
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");
}

export type JoinMemberRolesInput = { roles: readonly string[] };

export function joinMemberRoles({ roles }: JoinMemberRolesInput): string {
  return [...new Set(roles)].join(",");
}

export type MemberHasRoleWhereInput = { name: string };

/** Prisma filter: `member.role` (comma-separated) contains exactly `name`. */
export function memberHasRoleWhere({ name }: MemberHasRoleWhereInput) {
  return {
    OR: [
      { role: name },
      { role: { startsWith: `${name},` } },
      { role: { endsWith: `,${name}` } },
      { role: { contains: `,${name},` } },
    ],
  };
}
