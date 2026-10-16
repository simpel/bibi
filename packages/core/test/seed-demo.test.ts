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

describe("seed:demo slices 1–5 (ADR 0025)", () => {
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
      where: { organizationId: vinga?.organizationId, role: "Kitchen" },
    });
    expect(vingaKitchen).toBe(0);
    const items = ({ organizationId }: { organizationId?: string }) =>
      db.item.count({ where: { organizationId, status: "ACTIVE" } });
    expect(await items({ organizationId: lind?.organizationId })).toBe(61);
    expect(await items({ organizationId: vinga?.organizationId })).toBe(9);
    const dinner = await db.item.findFirst({
      where: { organizationId: lind?.organizationId, name: "Three-course dinner" },
      include: { choiceGroups: { orderBy: { position: "asc" } }, components: true },
    });
    expect(dinner?.choiceGroups.map((group) => group.name)).toEqual([
      "Starter",
      "Main course",
      "Dessert",
    ]);
    expect(dinner?.components).toHaveLength(8);
    const ownPackage = await db.item.findFirst({
      where: { organizationId: lind?.organizationId, name: "Nordkust management team" },
      include: { customer: true },
    });
    expect(ownPackage?.customer?.name).toBe("Nordkust Logistik AB");
    const tour = await db.item.findFirst({
      where: { organizationId: vinga?.organizationId, name: "Lighthouse tour to Vinga" },
      include: { components: { include: { part: true }, orderBy: { createdAt: "asc" } } },
    });
    expect(tour?.components.map((component) => component.part.name).sort()).toEqual([
      "Jonna Sand",
      "RIB Snabben",
    ]);
    const vinga220 = await db.itemSetup.findFirst({
      where: { organizationId: lind?.organizationId, capacity: 220, setup: { name: "Theatre" } },
      include: { item: true },
    });
    expect(vinga220?.item).toMatchObject({ name: "Vinga (auditorium)", priceMinor: 450_000 });
    const allergens = await db.vocabulary.count({
      where: { organizationId: vinga?.organizationId, name: "Allergens" },
    });
    expect(allergens).toBe(0);
    const customers = ({ organizationId }: { organizationId?: string }) =>
      db.customer.count({ where: { organizationId } });
    expect(await customers({ organizationId: lind?.organizationId })).toBe(7);
    expect(await customers({ organizationId: vinga?.organizationId })).toBe(3);
    const nordkust = await db.customer.findFirst({
      where: { organizationId: lind?.organizationId, name: "Nordkust Logistik AB" },
      include: { contacts: { orderBy: { name: "asc" } }, priceLists: true },
    });
    expect(nordkust?.contacts.map((contact) => contact.name)).toEqual([
      "Fakturor Nordkust",
      "Karin Wallin",
    ]);
    expect(nordkust?.priceLists.map((list) => Number(list.discountPercent))).toEqual([15]);
    const statuses = await db.bookingStatus.count({
      where: { organizationId: lind?.organizationId },
    });
    expect(statuses).toBe(4);
    const bookings = await db.booking.findMany({
      where: { organizationId: lind?.organizationId },
      orderBy: { reference: "asc" },
    });
    expect(bookings).toHaveLength(10);
    const erik = await db.member.findFirst({
      where: { organizationId: lind?.organizationId, user: { name: "Erik Lund" } },
    });
    expect(bookings[0]).toMatchObject({ reference: 1, estimatedHeadcount: 40 });
    expect(bookings[0]?.salesOwnerId).toBe(erik?.userId);
  });
});
