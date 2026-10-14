import { SYSTEM_ACTOR_ID, scopedDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { createVenue, execute } from "../src/index";
import { testContext, unwrap } from "./helpers";

describe("createdBy (ADR 0006)", () => {
  it("stamps the acting user on rows an operation creates", async () => {
    const context = testContext();
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Hall" }, context }),
    });
    expect(venue.createdBy).toBe(context.actor.userId);
  });

  it("stamps SYSTEM_ACTOR_ID for system work", async () => {
    const context = testContext({ actor: { type: "system", userId: null } });
    const venue = unwrap({
      result: await execute({ operation: createVenue, input: { name: "Hall" }, context }),
    });
    expect(venue.createdBy).toBe(SYSTEM_ACTOR_ID);
  });

  it("overrides a spoofed createdBy on create, createMany and upsert", async () => {
    const context = testContext();
    const author = context.actor.userId;
    const db = context.db;
    const created = await db.venue.create({
      data: { name: "A", organizationId: "", createdBy: "x" },
    });
    expect(created.createdBy).toBe(author);
    const many = await db.venue.createManyAndReturn({
      data: [{ name: "B", organizationId: "", createdBy: "x" }],
    });
    expect(many.map((row) => row.createdBy)).toEqual([author]);
    const upserted = await db.venue.upsert({
      where: { id: createId() },
      create: { name: "C", organizationId: "", createdBy: "x" },
      update: {},
    });
    expect(upserted.createdBy).toBe(author);
  });

  it("never lets an update rewrite the author", async () => {
    const context = testContext();
    const created = await context.db.venue.create({ data: { name: "A", organizationId: "" } });
    const updated = await context.db.venue.update({
      where: { id: created.id },
      data: { name: "B", createdBy: "someone-else" },
    });
    expect(updated.createdBy).toBe(context.actor.userId);
  });

  it("leaves models without the column alone", async () => {
    const context = testContext();
    const row = await context.db.auditLog.create({
      data: { organizationId: "", actorType: "USER", operation: "test.noop" },
    });
    expect(row.organizationId).toBe(context.organizationId);
    expect(row).not.toHaveProperty("createdBy");
  });

  it("refuses a scoped client without an actor", () => {
    expect(() => scopedDb({ organizationId: `org_${createId()}`, actorId: " " })).toThrow(
      /empty actor id/,
    );
  });
});
