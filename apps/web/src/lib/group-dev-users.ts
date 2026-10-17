import type { DevUser } from "@okazi/auth";

export type DevUserGroup = {
  organization: string;
  /** The first user of each role, in the order the roles first appear. */
  representatives: DevUser[];
  users: DevUser[];
};

/** Seeded users per organization, in the order the organizations first appear. */
export function groupDevUsers({ users }: { users: DevUser[] }): DevUserGroup[] {
  const groups = new Map<string, DevUser[]>();
  for (const user of users)
    groups.set(user.organization, [...(groups.get(user.organization) ?? []), user]);
  return [...groups].map(([organization, members]) => ({
    organization,
    representatives: members.filter((m, i) => members.findIndex((o) => o.role === m.role) === i),
    users: members,
  }));
}
