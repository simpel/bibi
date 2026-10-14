import { describe, expect, it } from "vitest";
import { createRoom, createVenue, execute, getVenue, listVenues, updateVenue } from "../src/index";
import { testContext, unwrap } from "./helpers";

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
    const roomB = await execute({
      operation: createRoom,
      input: { venueId: venue.id, name: "Sneaky" },
      context: orgB,
    });
    expect(roomB.ok ? null : roomB.error.code).toBe("VALIDATION");
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

  it("rejects a room pointing at another org's venue at the database level", async () => {
    const venue = await orgA.db.venue.create({ data: { name: "A", organizationId: "" } });
    await expect(
      orgB.db.room.create({ data: { name: "R", venueId: venue.id, organizationId: "" } }),
    ).rejects.toThrow();
  });

  it("keeps the audit log append-only", async () => {
    await expect(orgA.db.auditLog.deleteMany({})).rejects.toThrow(/append-only/);
  });
});
