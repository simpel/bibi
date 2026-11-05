import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

type SeedGroupInput = { client: Client };

/** An order with two lines made alternatives in the client's organization. */
async function seedGroup({ client }: SeedGroupInput) {
  const seed = await seedProgram({ client });
  const other = await call({
    client,
    name: "line_create",
    args: { orderId: seed.orderId, entityTypeId: seed.programTypeId, name: "Hidden option" },
  });
  expect(other.isError, JSON.stringify(other.data)).toBe(false);
  const lineIds = [seed.lineId, other.data.id as string];
  const group = await call({
    client,
    name: "alternativeGroup_create",
    args: { orderId: seed.orderId, name: "Hidden choice", lineIds },
  });
  expect(group.isError, JSON.stringify(group.data)).toBe(false);
  return { ...seed, lineIds, groupId: group.data.id as string };
}

describe("cross-organization isolation: alternative groups (ADR 0052)", () => {
  it("hides one organization's groups and refuses its lines and orders", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedGroup({ client: a });
    const id = secret.groupId;
    const [lineId] = secret.lineIds;

    for (const [name, args] of [
      ["alternativeGroup_get", { id }],
      ["alternativeGroup_update", { id, name: "Hacked" }],
      ["alternativeGroup_archive", { id }],
      ["alternativeGroup_choose", { id, lineId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const foreignOrder = await call({
      client: b,
      name: "alternativeGroup_create",
      args: { orderId: secret.orderId, name: "Intruder", lineIds: secret.lineIds },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(foreignOrder.data.code);

    const own = await seedProgram({ client: b });
    const foreignLines = await call({
      client: b,
      name: "alternativeGroup_create",
      args: { orderId: own.orderId, name: "Intruder", lineIds: secret.lineIds },
    });
    expect(foreignLines.data.code).toBe("VALIDATION");
    expect(JSON.stringify(foreignLines.data)).not.toContain("Hidden");
    for (const args of [{}, { orderId: secret.orderId }]) {
      const listed = await call({ client: b, name: "alternativeGroup_list", args });
      expect(listed.data.items).toEqual([]);
    }

    const mine = await call({ client: a, name: "alternativeGroup_get", args: { id } });
    expect(mine.data).toMatchObject({ name: "Hidden choice", chosenLineId: null });
    expect(mine.data.optionLineIds).toHaveLength(2);
  });
});
