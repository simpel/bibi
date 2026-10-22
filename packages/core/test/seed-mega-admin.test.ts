import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { afterAll, describe, expect, it } from "vitest";
import { checkDemoMegaAdmin } from "../src/seed/demo/mega-admin-checks";
import { seedMegaAdmin } from "../src/seed/demo/seed-mega-admin";

const db = getDb();
const email = `mega-${createId().slice(0, 8)}@admin.bibi.test`;
const organizationIds: string[] = [];

const newOrg = async () => {
  const id = createId();
  await db.organization.create({ data: { id, name: "Mega", slug: id, createdAt: new Date() } });
  organizationIds.push(id);
  return id;
};

// The test user would otherwise stay in the dev database and show up in the dev switcher.
afterAll(async () => {
  await db.user.deleteMany({ where: { email } });
  await db.organization.deleteMany({ where: { id: { in: organizationIds } } });
});

describe("seeded mega admin", () => {
  it("is a superadmin and admin of every org, keeps its id across reseeds", async () => {
    const first = await newOrg();
    const second = await newOrg();
    const user = await seedMegaAdmin({ db, organizationIds: [first], email });
    expect((await db.user.findUniqueOrThrow({ where: { email } })).role).toBe("superadmin");
    await seedMegaAdmin({ db, organizationIds: [first, second], email });
    expect((await db.user.findUniqueOrThrow({ where: { email } })).id).toBe(user.id);
    expect(await db.member.count({ where: { userId: user.id } })).toBe(2);
    expect(await checkDemoMegaAdmin({ db, organizationIds, email })).toEqual([]);
    await db.member.deleteMany({ where: { userId: user.id, organizationId: second } });
    expect(await checkDemoMegaAdmin({ db, organizationIds, email })).toHaveLength(1);
  });
});
