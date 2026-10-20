import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
  createVenue,
  type ExecuteContext,
  execute,
  listAuditLogs,
  setUserPreference,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { testContext, unwrap } from "./helpers";

const list = async ({ context, input = {} }: { context: ExecuteContext; input?: object }) =>
  unwrap({ result: await execute({ operation: listAuditLogs, input, context }) });

type ReaderInput = { of: ExecuteContext; permissions: Record<string, string[]> };

const reader = ({ of, permissions }: ReaderInput) =>
  testContext({
    organizationId: of.organizationId,
    permissions: { audit: ["read"], ...permissions },
  });

describe("auditLog feature scope (ADR 0050)", () => {
  it("hides rows of features the caller cannot view", async () => {
    const admin = testContext();
    await createTestCustomer({ context: admin, name: "Hidden AB" });
    await execute({ operation: createVenue, input: { name: "Hall" }, context: admin });
    const venueOnly = reader({ of: admin, permissions: { venue: ["read"] } });
    const types = (await list({ context: venueOnly })).items.map((row) => row.entityType);
    expect(types).toEqual(["venue"]);
    const customerReader = reader({
      of: admin,
      permissions: { customer: ["read"], configuration: ["read"] },
    });
    const visible = new Set(
      (await list({ context: customerReader })).items.map((r) => r.entityType),
    );
    expect(visible.has("customer")).toBe(true);
    expect(visible.has("venue")).toBe(false);
  });

  it("hides rows of unknown entity types from everyone but the system", async () => {
    const admin = testContext();
    await getDb().auditLog.create({
      data: {
        id: createId(),
        organizationId: admin.organizationId,
        operation: "mystery.change",
        entityType: "mystery",
        entityId: "x",
        actorType: "USER",
        actorId: admin.actor.userId,
      },
    });
    expect((await list({ context: admin })).items).toEqual([]);
    const system = testContext({
      organizationId: admin.organizationId,
      actor: { type: "system", userId: null },
    });
    expect((await list({ context: system })).items).toHaveLength(1);
  });

  it("keeps preference rows private to their owner", async () => {
    const owner = testContext();
    const input = { key: "table.columns.x", value: ["a"] };
    unwrap({ result: await execute({ operation: setUserPreference, input, context: owner }) });
    const filter = { entityType: "userPreference" };
    expect((await list({ context: owner, input: filter })).items).toHaveLength(1);
    const admin = testContext({ organizationId: owner.organizationId });
    expect((await list({ context: admin, input: filter })).items).toEqual([]);
  });
});
