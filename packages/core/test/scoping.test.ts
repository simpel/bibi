import { describe, expect, it } from "vitest";
import { createItem, createVenue, execute, getVenue, listVenues, updateVenue } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

describe("organization scoping", () => {
  const orgA = testContext();
  const orgB = testContext();

  it("never exposes another organization's rows through operations", async () => {
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Volvo" }, context: orgA }),
    });
    expect(venue.organizationId).toBe(orgA.organizationId);
    const listB = unwrap({
      result: await execute({ operation: listVenues, input: {}, context: orgB }),
    });
    expect(listB.items.map((v) => v.id)).not.toContain(venue.id);
    const getB = await execute({ operation: getVenue, input: { id: venue.id }, context: orgB });
    expect(getB.ok ? null : getB.error.code).toBe("NOT_FOUND");
    const updB = await execute({
      operation: updateVenue,
      input: { id: venue.id, name: "Hijacked" },
      context: orgB,
    });
    expect(updB.ok ? null : updB.error.code).toBe("NOT_FOUND");
    const typeA = await createRoomType({ context: orgA });
    const crossType = await execute({
      operation: createItem,
      input: { entityTypeId: typeA.id, name: "Sneaky" },
      context: orgB,
    });
    expect(crossType.ok ? null : crossType.error.code).toBe("VALIDATION");
    const typeB = await createRoomType({ context: orgB });
    const crossVenue = await execute({
      operation: createItem,
      input: { entityTypeId: typeB.id, venueId: venue.id, name: "Sneaky" },
      context: orgB,
    });
    expect(crossVenue.ok ? null : crossVenue.error.code).toBe("VALIDATION");
  });

  it("forces organizationId in the scoped client even when callers pass another", async () => {
    const created = await orgB.db.venue.create({
      data: { name: "Spoof", organizationId: orgA.organizationId },
    });
    expect(created.organizationId).toBe(orgB.organizationId);
    const viaUnique = await orgA.db.venue.findUnique({ where: { id: created.id } });
    expect(viaUnique).toBeNull();
    const updated = await orgA.db.venue.updateMany({
      where: { OR: [{ id: created.id }, { organizationId: orgB.organizationId }] },
      data: { name: "x" },
    });
    expect(updated.count).toBe(0);
    const deleted = await orgA.db.venue.deleteMany({ where: { id: created.id } });
    expect(deleted.count).toBe(0);
  });

  it("rejects an item pointing at another org's venue or type at the database level", async () => {
    const venue = await orgA.db.venue.create({ data: { name: "A", organizationId: "" } });
    const typeA = await orgA.db.entityType.create({
      data: { base: "ITEM", name: "T", organizationId: "" },
    });
    const typeB = await orgB.db.entityType.create({
      data: { base: "ITEM", name: "T", organizationId: "" },
    });
    const record = await orgB.db.record.create({
      data: { base: "ITEM", entityTypeId: typeB.id, organizationId: "" },
    });
    const item = { id: record.id, name: "R", organizationId: "" };
    await expect(
      orgB.db.item.create({ data: { ...item, entityTypeId: typeB.id, venueId: venue.id } }),
    ).rejects.toThrow();
    await expect(
      orgB.db.item.create({ data: { ...item, entityTypeId: typeA.id } }),
    ).rejects.toThrow();
    await expect(
      orgB.db.record.create({ data: { base: "ITEM", entityTypeId: typeA.id, organizationId: "" } }),
    ).rejects.toThrow();
  });

  it("rejects a record row extending another org's supertable row", async () => {
    const typeA = await orgA.db.entityType.create({
      data: { base: "ITEM", name: "T", organizationId: "" },
    });
    const typeB = await orgB.db.entityType.create({
      data: { base: "ITEM", name: "T", organizationId: "" },
    });
    const recordA = await orgA.db.record.create({
      data: { base: "ITEM", entityTypeId: typeA.id, organizationId: "" },
    });
    await expect(
      orgB.db.item.create({
        data: { id: recordA.id, name: "R", entityTypeId: typeB.id, organizationId: "" },
      }),
    ).rejects.toThrow();
  });

  it("keeps the audit log append-only", async () => {
    await expect(orgA.db.auditLog.deleteMany({})).rejects.toThrow(/append-only/);
  });
});
