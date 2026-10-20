import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

/** A one-type, two-phase draft on the given existing item type. */
const draft = ({ entityTypeId }: { entityTypeId: string }) => ({
  itemTypes: [
    {
      entityTypeId,
      name: "Room",
      states: [
        { name: "Held", color: "#f59e0b", initial: true },
        { name: "Released", color: "#94a3b8", released: true },
      ],
    },
  ],
  phases: [
    { name: "Open", color: "#f59e0b", entry: true },
    { name: "Closed", color: "#6b7280", terminal: true },
  ],
  cells: [{ phase: "Open", type: "Room", state: "Held" }],
});

describe("cross-organization isolation: the guided pipeline setup", () => {
  it("refuses another organization's item type in a preview and an activation", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const args = { base: "ITEM", name: "Room", capabilities: ["BOOKABLE"] };
    const typeA = await call({ client: a, name: "entityType_create", args });
    expect(typeA.isError, JSON.stringify(typeA.data)).toBe(false);
    const foreign = draft({ entityTypeId: typeA.data.id });
    const preview = await call({ client: b, name: "pipelineSetup_preview", args: foreign });
    expect(preview.data.code).toBe("NOT_FOUND");
    const activated = await call({ client: b, name: "pipelineSetup_activate", args: foreign });
    expect(activated.data.code).toBe("NOT_FOUND");
    const phases = await call({ client: b, name: "ticketPhase_list", args: {} });
    expect(phases.data.items).toEqual([]);
    const own = await call({ client: a, name: "pipelineSetup_activate", args: foreign });
    expect(own.isError, JSON.stringify(own.data)).toBe(false);
    const states = await call({
      client: a,
      name: "itemState_list",
      args: { entityTypeId: typeA.data.id },
    });
    expect(states.data.items.map((row: { name: string }) => row.name)).toEqual([
      "Held",
      "Released",
    ]);
  });

  it("never puts another organization's item types into a preset draft", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const args = { base: "ITEM", name: "Secret room", capabilities: ["BOOKABLE"] };
    const typeA = await call({ client: a, name: "entityType_create", args });
    expect(typeA.isError, JSON.stringify(typeA.data)).toBe(false);
    const draftB = await call({
      client: b,
      name: "pipelineSetup_presetDraft",
      args: { key: "empty" },
    });
    expect(draftB.isError, JSON.stringify(draftB.data)).toBe(false);
    expect(draftB.data.itemTypes).toEqual([]);
    const draftA = await call({
      client: a,
      name: "pipelineSetup_presetDraft",
      args: { key: "empty" },
    });
    expect(draftA.data.itemTypes.map((row: { name: string }) => row.name)).toEqual(["Secret room"]);
  });
});
