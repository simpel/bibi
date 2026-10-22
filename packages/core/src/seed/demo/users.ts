import type { Db } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { ADMIN_ROLE } from "../../permissions/fixed-roles";
import type { DemoOrg, DemoUser } from "./types";

export type DemoEmailDomainInput = { org: DemoOrg };

/** `lindholmen-demo.bibi.test`: reserved TLD, so mail never leaves Mailpit. */
export function demoEmailDomain({ org }: DemoEmailDomainInput): string {
  return `${org.slug}.bibi.test`;
}

const toAscii = ({ value }: { value: string }): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".");

export type DemoEmailInput = { org: DemoOrg; user: DemoUser };

/** "Peter Sjoberg" → `peter.sjoberg@lindholmen-demo.bibi.test` (sign in with magic link or code). */
export function demoEmail({ org, user }: DemoEmailInput): string {
  return `${toAscii({ value: user.name })}@${demoEmailDomain({ org })}`;
}

export type BootstrapDemoOrgInput = { db: Db; org: DemoOrg };

/** Member id per user name, for `member.assignRole`. */
export type DemoMembers = Map<string, string>;

/** User id per user name, for the assignees and followers of tickets (ADR 0034). */
export type DemoUserIds = Map<string, string>;

/**
 * The documented exception to "everything via execute" (ADR 0025, `docs/demo-seed.md`): the
 * organization, users and memberships are Better Auth's rows, written as its signup and
 * `addMember` would. Admins get `admin`; everyone else starts without roles until the seed
 * assigns them through `member.assignRole`.
 */
export async function bootstrapDemoOrg({ db, org }: BootstrapDemoOrgInput) {
  const organizationId = createId();
  const createdAt = new Date();
  await db.organization.create({
    data: { id: organizationId, name: org.name, slug: org.slug, createdAt },
  });
  const members: DemoMembers = new Map();
  const userIds: DemoUserIds = new Map();
  for (const user of org.users) {
    const userId = createId();
    const email = demoEmail({ org, user });
    await db.user.create({ data: { id: userId, name: user.name, email, emailVerified: true } });
    const role = user.role === ADMIN_ROLE ? ADMIN_ROLE : "";
    const memberId = createId();
    await db.member.create({ data: { id: memberId, organizationId, userId, role, createdAt } });
    members.set(user.name, memberId);
    userIds.set(user.name, userId);
  }
  return { organizationId, members, userIds };
}
