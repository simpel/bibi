import type { Db } from "@okazi/db";
import { deleteOrganizations } from "./delete-organizations";
import { DEMO_ORGS } from "./seed-demo";

/** Reserved test domains (RFC 2606/6761): tests sign up users here, people never do. */
const TEST_EMAIL_ENDINGS = [
  ".test",
  ".example",
  ".invalid",
  ".localhost",
  "@example.com",
  "@example.org",
  "@example.net",
];

const testEmail = { OR: TEST_EMAIL_ENDINGS.map((ending) => ({ email: { endsWith: ending } })) };

/** Organizations per transaction: keeps each `IN (...)` and transaction small. */
const BATCH_SIZE = 200;

export type TestLeftoversInput = { db: Db };

export type CleanupTestLeftoversInput = TestLeftoversInput & { dryRun: boolean };

export type CleanupTestLeftoversOutput = { organizations: number; users: number };

/**
 * Organizations that tests left behind: not a canonical demo slug (`DEMO_ORGS`), and every member
 * (if any) has an email on a reserved test domain. An organization with one real member is kept.
 */
export async function findTestLeftoverOrgs({ db }: TestLeftoversInput): Promise<string[]> {
  const orgs = await db.organization.findMany({
    where: {
      slug: { notIn: DEMO_ORGS.map((org) => org.slug) },
      members: { every: { user: testEmail } },
    },
    select: { id: true },
  });
  return orgs.map((org) => org.id);
}

/** Users on a test domain who are no longer a member of any organization. */
const orphanTestUsers = { AND: [testEmail, { members: { none: {} } }] };

/**
 * Deletes the test leftovers in batches, then the test users left without a membership. With
 * `dryRun` it only counts (orphan users are counted as of now, before any organization goes).
 */
export async function cleanupTestLeftovers({
  db,
  dryRun,
}: CleanupTestLeftoversInput): Promise<CleanupTestLeftoversOutput> {
  const ids = await findTestLeftoverOrgs({ db });
  if (dryRun) {
    return { organizations: ids.length, users: await db.user.count({ where: orphanTestUsers }) };
  }
  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    await deleteOrganizations({ db, organizationIds: ids.slice(start, start + BATCH_SIZE) });
  }
  const users = await db.user.deleteMany({ where: orphanTestUsers });
  return { organizations: ids.length, users: users.count };
}
