import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

const STATE = { name: "Secret state", color: "#22c55e" } as const;

/** The organization's seeded line, its item type and that type's states. */
async function seedStates({ client }: { client: Client }) {
  const seed = await seedProgram({ client });
  const item = await call({ client, name: "item_get", args: { id: seed.itemId } });
  const entityTypeId = item.data.entityTypeId;
  const extra = await call({ client, name: "itemState_create", args: { entityTypeId, ...STATE } });
  expect(extra.isError, JSON.stringify(extra.data)).toBe(false);
  const listed = await call({ client, name: "itemState_list", args: { entityTypeId } });
  const ids: string[] = listed.data.items.map((state: { id: string }) => state.id);
  return { ...seed, entityTypeId, stateId: extra.data.id, ids };
}

describe("cross-organization isolation: item states and line states", () => {
  it("hides one organization's states and refuses them on another's lines", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seedA = await seedStates({ client: a });
    const seedB = await seedStates({ client: b });
    const { stateId: id, entityTypeId, ids, lineId } = seedA;
    for (const [name, args] of [
      ["itemState_get", { id }],
      ["itemState_update", { id, name: "Hacked" }],
      ["itemState_archive", { id }],
      ["itemState_archivePreview", { id }],
      ["itemState_setTransitions", { id, toStateIds: [] }],
      ["line_changeState", { lineId, stateId: seedB.stateId }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    for (const [name, args] of [
      ["itemState_create", { entityTypeId, ...STATE, name: "Intruder" }],
      ["itemState_reorder", { entityTypeId, ids }],
      ["itemState_setTransitions", { id: seedB.stateId, toStateIds: [id] }],
      ["line_changeState", { lineId: seedB.lineId, stateId: id }],
      ["itemState_archive", { id: seedB.stateId, targetStateId: id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("VALIDATION");
    }
    const foreign = await call({
      client: b,
      name: "itemState_archivePreview",
      args: { id: seedB.stateId, targetStateId: id },
    });
    expect(foreign.data.archivable).toBe(false);
    const listed = await call({ client: b, name: "itemState_list", args: { entityTypeId } });
    expect(listed.data.items).toEqual([]);
    const expired = await call({ client: b, name: "ticket_expireHolds" });
    expect(expired.data.items).toEqual([]);
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { itemStates { items { id } } }" },
    });
    expect(graph.data.data.itemStates.items.map((s: { id: string }) => s.id)).not.toContain(id);
    const own = await call({ client: a, name: "itemState_get", args: { id } });
    expect(own.data.name).toBe(STATE.name);
  });
});
