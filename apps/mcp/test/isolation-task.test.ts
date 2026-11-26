import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { type SeededOrder, seedOrder } from "./seed-order";

const DUE = { dueAt: "2037-11-02T13:00:00.000Z" };
const WINDOW = { startsAt: "2037-11-02T13:00:00.000Z", endsAt: "2037-11-02T14:00:00.000Z" };

/** A bookable room in the client's organization. */
async function seedRoom({ client }: { client: Client }) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret room", capabilities: ["BOOKABLE"] },
  });
  const room = await call({
    client,
    name: "item_create",
    args: { entityTypeId: type.data.id, name: "Secret hall" },
  });
  expect(room.isError, JSON.stringify(room.data)).toBe(false);
  return room.data.id as string;
}

type SeedTaskInput = { client: Client; order: SeededOrder; itemId: string };

/** A task type and an unlinked task at the seeded order's customer that books a room. */
async function seedTask({ client, order, itemId }: SeedTaskInput) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "TASK", name: "Secret visit" },
  });
  const made = await call({
    client,
    name: "task_create",
    args: {
      entityTypeId: type.data.id,
      customerId: order.customerId,
      contactId: order.contactId,
      ...DUE,
      items: [{ itemId, hold: "BOOK", ...WINDOW }],
    },
  });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return { id: made.data.id as string, entityTypeId: type.data.id as string };
}

const refused = ({ code }: { code: unknown }) =>
  expect(["NOT_FOUND", "VALIDATION"]).toContain(code);

describe("cross-organization isolation: tasks (ADR 0117, 0120)", () => {
  it("hides one organization's tasks and refuses its ids as references", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secretOrder = await seedOrder({ client: a });
    const secretItemId = await seedRoom({ client: a });
    const secret = await seedTask({ client: a, order: secretOrder, itemId: secretItemId });
    const ownOrder = await seedOrder({ client: b });
    const ownItemId = await seedRoom({ client: b });
    const own = await seedTask({ client: b, order: ownOrder, itemId: ownItemId });
    const id = secret.id;

    for (const [name, input] of [
      ["task_get", { id }],
      ["task_update", { id, note: "Hijacked" }],
      ["task_complete", { id }],
      ["task_reopen", { id }],
      ["task_archive", { id }],
      ["task_restore", { id }],
      ["task_delete", { id }],
      ["task_linkOrder", { taskId: id, orderId: ownOrder.id }],
    ] as const) {
      expect((await call({ client: b, name, args: input })).data.code, name).toBe("NOT_FOUND");
    }

    const linked = await call({
      client: b,
      name: "task_linkOrder",
      args: { taskId: own.id, orderId: secretOrder.id },
    });
    refused({ code: linked.data.code });

    const base = {
      entityTypeId: own.entityTypeId,
      customerId: ownOrder.customerId,
      contactId: ownOrder.contactId,
      ...DUE,
    };
    for (const extra of [
      { entityTypeId: secret.entityTypeId },
      { customerId: secretOrder.customerId, contactId: secretOrder.contactId },
      { contactId: secretOrder.contactId },
      { orderId: secretOrder.id },
      { items: [{ itemId: secretItemId, hold: "RELATED" }] },
      { items: [{ itemId: secretItemId, hold: "PREBOOK", ...WINDOW }] },
      { items: [{ itemId: secretItemId, hold: "BOOK", ...WINDOW }] },
    ]) {
      const created = await call({ client: b, name: "task_create", args: { ...base, ...extra } });
      refused({ code: created.data.code });
    }

    for (const input of [{ customerId: secretOrder.customerId }, { orderId: secretOrder.id }]) {
      const listed = await call({ client: b, name: "task_list", args: input });
      expect(listed.data.items, JSON.stringify(input)).toEqual([]);
    }

    for (const items of [
      [{ itemId: secretItemId, hold: "RELATED" }],
      [{ itemId: secretItemId, hold: "BOOK", ...WINDOW }],
    ]) {
      const updated = await call({
        client: b,
        name: "task_update",
        args: { id: own.id, items },
      });
      refused({ code: updated.data.code });
    }

    const range = { from: "2037-11-01", to: "2037-11-07" };
    const calendar = await call({ client: b, name: "calendar_range", args: range });
    expect(calendar.data.blocks.map((block: { taskId: string | null }) => block.taskId)).toEqual([
      own.id,
    ]);
    expect(calendar.data.tasks.map((task: { id: string }) => task.id)).not.toContain(id);
    const held = await call({ client: b, name: "occupancy_list", args: { itemId: secretItemId } });
    expect(held.data.items ?? []).toEqual([]);

    const order = await call({
      client: b,
      name: "order_create",
      args: {
        entityTypeId: ownOrder.entityTypeId,
        customerId: ownOrder.customerId,
        contactId: ownOrder.contactId,
        taskIds: [id],
      },
    });
    refused({ code: order.data.code });
    expect(JSON.stringify(order.data)).toContain("taskIds");

    const mine = await call({ client: a, name: "task_get", args: { id } });
    expect(mine.data).toMatchObject({ id, orderId: null, doneAt: null, status: "ACTIVE" });
    expect(mine.data.items).toMatchObject([{ itemId: secretItemId, hold: "BOOK" }]);
    const ownHolds = await call({ client: a, name: "calendar_range", args: range });
    expect(
      ownHolds.data.blocks.some((block: { taskId: string | null }) => block.taskId === id),
    ).toBe(true);
  });
});
