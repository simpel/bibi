import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { checkDemoMegaAdmin } from "../src/seed/demo/mega-admin-checks";
import { seedMegaAdmin } from "../src/seed/demo/seed-mega-admin";

const orgOf = async ({ db }: { db: ReturnType<typeof getDb> }) =>
  (
    await db.organization.create({
      data: { id: createId(), name: "Mega", slug: createId(), createdAt: new Date() },
    })
  ).id;

describe("seeded mega admin", () => {
  it("is a platform admin and owner of every org, keeps its id across reseeds", async () => {
    const db = getDb();
    const email = `mega-${createId().slice(0, 8)}@admin.okazi.test`;
    const first = await orgOf({ db });
    const second = await orgOf({ db });
    await seedMegaAdmin({ db, organizationIds: [first], email });
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("admin");
    await seedMegaAdmin({ db, organizationIds: [first, second], email });
    expect((await db.user.findUniqueOrThrow({ where: { email } })).id).toBe(user.id);
    expect(await db.member.count({ where: { userId: user.id } })).toBe(2);
    const organizationIds = [first, second];
    expect(await checkDemoMegaAdmin({ db, organizationIds, email })).toEqual([]);
    await db.member.deleteMany({ where: { userId: user.id, organizationId: second } });
    expect(await checkDemoMegaAdmin({ db, organizationIds, email })).toHaveLength(1);
  });
});
