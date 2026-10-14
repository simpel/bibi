import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { lindholmen } from "../src/seed/demo/data/lindholmen/lindholmen";
import { vingaleden } from "../src/seed/demo/data/vingaleden/vingaleden";
import { seedDemo } from "../src/seed/demo/seed-demo";

/** Same data as the real demo, under unique slugs so parallel runs and dev data never clash. */
const testOrgs = () => {
  const suffix = createId().slice(0, 8);
  return [lindholmen, vingaleden].map((org) => ({ ...org, slug: `${org.slug}-${suffix}` }));
};

describe("seed:demo slices 1–2 (ADR 0025)", () => {
  it("creates both orgs with roles and members, passes its checks and is idempotent", async () => {
    const orgs = testOrgs();
    const first = await seedDemo({ orgs });
    if (!first.ok) throw first.error;
    const second = await seedDemo({ orgs });
    if (!second.ok) throw second.error;
    const db = getDb();
    for (const org of orgs) {
      expect(await db.organization.count({ where: { slug: org.slug } })).toBe(1);
    }
    const [lind, vinga] = second.value.organizations;
    const roles = ({ organizationId }: { organizationId?: string }) =>
      db.organizationRole.count({ where: { organizationId } });
    expect(await roles({ organizationId: lind?.organizationId })).toBe(7);
    expect(await roles({ organizationId: vinga?.organizationId })).toBe(3);
    expect(await db.member.count({ where: { organizationId: lind?.organizationId } })).toBe(8);
    const vingaKitchen = await db.organizationRole.count({
      where: { organizationId: vinga?.organizationId, role: "Kök" },
    });
    expect(vingaKitchen).toBe(0);
    const items = ({ organizationId }: { organizationId?: string }) =>
      db.item.count({ where: { organizationId, status: "ACTIVE" } });
    expect(await items({ organizationId: lind?.organizationId })).toBe(10);
    expect(await items({ organizationId: vinga?.organizationId })).toBe(3);
    const vinga220 = await db.itemSetup.findFirst({
      where: { organizationId: lind?.organizationId, capacity: 220, setup: { name: "Bio" } },
      include: { item: true },
    });
    expect(vinga220?.item).toMatchObject({ name: "Vinga (aula)", priceMinor: 450_000 });
    const allergens = await db.vocabulary.count({
      where: { organizationId: vinga?.organizationId, name: "Allergener" },
    });
    expect(allergens).toBe(0);
  });
});
