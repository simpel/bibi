import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { lindholmen } from "../src/seed/demo/data/lindholmen/lindholmen";
import { vingaleden } from "../src/seed/demo/data/vingaleden/vingaleden";
import { seedDemo } from "../src/seed/demo/seed-demo";
import { LINDHOLMEN_LINE_STATES } from "./seed-demo-lines";

/** Same data as the real demo, under unique slugs so parallel runs and dev data never clash. */
const testOrgs = () => {
  const suffix = createId().slice(0, 8);
  return [lindholmen, vingaleden].map((org) => ({ ...org, slug: `${org.slug}-${suffix}` }));
};

// Each test seeds the full demo (twice for idempotency checks); allow headroom for a loaded machine.
describe("seed:demo slices 1–5 (ADR 0025)", { timeout: 60_000 }, () => {
  it("creates both orgs with fixed-role members, passes its checks and is idempotent", async () => {
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
    expect(await db.member.count({ where: { organizationId: lind?.organizationId } })).toBe(8);
    const roles = await db.member.findMany({
      where: { organizationId: vinga?.organizationId },
      select: { role: true },
    });
    expect(roles.map((member) => member.role).sort()).toEqual([
      "admin",
      "manager",
      "member",
      "member",
    ]);
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
    expect(await db.ticketPhase.count({ where: { organizationId: lind?.organizationId } })).toBe(8);
    const tickets = await db.ticket.findMany({
      where: { organizationId: lind?.organizationId },
      orderBy: { reference: "asc" },
    });
    // L1–L14 and the leads F2, F3 and F6 with their room lines (ADR 0044, 0052).
    expect(tickets).toHaveLength(17);
    const johan = await db.member.findFirst({
      where: { organizationId: lind?.organizationId, user: { name: "Johan Ek" } },
    });
    expect(tickets[0]).toMatchObject({ reference: 1, estimatedHeadcount: 40 });
    const main = await db.assignment.findFirst({
      where: { recordId: tickets[0]?.id, responsibilityId: null },
      include: { followers: true },
    });
    expect(main?.assigneeId).toBe(johan?.userId);
    expect(main?.followers).toHaveLength(1);
    const lines = await db.line.findMany({
      where: { organizationId: lind?.organizationId },
      include: { state: true },
      orderBy: [{ name: "asc" }, { state: { name: "asc" } }],
    });
    expect(lines.map((line) => [line.name, line.state?.name, line.stateOverridden])).toEqual(
      LINDHOLMEN_LINE_STATES,
    );
  });
  it("re-seeds an organization that has occupancy rows", async () => {
    const orgs = testOrgs();
    const first = await seedDemo({ orgs });
    if (!first.ok) throw first.error;
    const db = getDb();
    const organizationId = first.value.organizations[0]?.organizationId;
    const item = await db.item.findFirst({ where: { organizationId } });
    if (!organizationId || !item) throw new Error("Seeded organization has no item");
    await db.occupancy.create({
      data: {
        organizationId,
        itemId: item.id,
        type: "MAINTENANCE",
        startsAt: new Date("2030-01-01T08:00:00Z"),
        endsAt: new Date("2030-01-01T10:00:00Z"),
      },
    });
    const second = await seedDemo({ orgs });
    if (!second.ok) throw second.error;
    expect(await db.occupancy.count({ where: { organizationId } })).toBe(0);
  });
});
