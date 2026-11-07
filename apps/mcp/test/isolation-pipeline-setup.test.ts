import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

/** A one-type, two-status draft on the given existing item type. */
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
  statuses: [
    { name: "Open", color: "#f59e0b", entry: true },
    { name: "Closed", color: "#6b7280", closes: true },
  ],
  cells: [{ orderStatus: "Open", type: "Room", state: "Held" }],
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
    const statuses = await call({ client: b, name: "orderStatus_list", args: {} });
    expect(statuses.data.items).toEqual([]);
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

describe("cross-organization isolation: example orders", () => {
  it("creates examples only in the caller's organization, never reusing another's items", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const room = { base: "ITEM", name: "Room", capabilities: ["BOOKABLE"] };
    const typeA = await call({ client: a, name: "entityType_create", args: room });
    const typeB = await call({ client: b, name: "entityType_create", args: room });
    expect(typeB.isError, JSON.stringify(typeB.data)).toBe(false);
    const hall = { entityTypeId: typeA.data.id, name: "Shared hall" };
    const itemA = await call({ client: a, name: "item_create", args: hall });
    expect(itemA.isError, JSON.stringify(itemA.data)).toBe(false);
    const setUp = draft({ entityTypeId: typeB.data.id });
    const activated = await call({ client: b, name: "pipelineSetup_activate", args: setUp });
    expect(activated.isError, JSON.stringify(activated.data)).toBe(false);
    const args = {
      typeNames: { customer: "Company", contact: "Contact", order: "Booking", line: "Line" },
      customer: { name: "Example Ltd", contactName: "Anna", contactEmail: "anna@example.com" },
      orders: [
        {
          title: "Meeting",
          startsInDays: 3,
          startTime: "09:00",
          endTime: "12:00",
          headcount: 10,
          advance: false,
          lines: [{ name: "Room", itemType: "Room", itemName: "Shared hall", quantity: 1 }],
        },
      ],
    };
    const created = await call({ client: b, name: "pipelineSetup_createExamples", args });
    expect(created.isError, JSON.stringify(created.data)).toBe(false);
    const foreignOrder = await call({
      client: a,
      name: "order_get",
      args: { id: created.data.orderIds[0] },
    });
    expect(foreignOrder.data.code).toBe("NOT_FOUND");
    const itemsA = await call({
      client: a,
      name: "item_list",
      args: { entityTypeId: typeA.data.id },
    });
    expect(itemsA.data.items.map((row: { id: string }) => row.id)).toEqual([itemA.data.id]);
    const customersA = await call({ client: a, name: "customer_list", args: {} });
    expect(customersA.data.items).toEqual([]);
  });
});
