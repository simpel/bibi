import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { type SeededOrder, seedOrder } from "./seed-order";

const TIMES = { startsAt: "2037-11-02T13:00:00.000Z", endsAt: "2037-11-02T14:00:00.000Z" };

type SeedTaskInput = { client: Client; order: SeededOrder };

/** A meeting task type and an unlinked task at the seeded order's customer. */
async function seedTask({ client, order }: SeedTaskInput) {
  const type = await call({
    client,
    name: "entityType_create",
    args: { base: "TASK", name: "Secret visit", taskShape: "MEETING" },
  });
  const made = await call({
    client,
    name: "task_create",
    args: {
      entityTypeId: type.data.id,
      customerId: order.customerId,
      contactId: order.contactId,
      ...TIMES,
    },
  });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return { id: made.data.id as string, entityTypeId: type.data.id as string };
}

const refused = ({ code }: { code: unknown }) =>
  expect(["NOT_FOUND", "VALIDATION"]).toContain(code);

describe("cross-organization isolation: tasks (ADR 0117)", () => {
  it("hides one organization's tasks and refuses its ids as references", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secretOrder = await seedOrder({ client: a });
    const secret = await seedTask({ client: a, order: secretOrder });
    const ownOrder = await seedOrder({ client: b });
    const own = await seedTask({ client: b, order: ownOrder });
    const id = secret.id;

    for (const [name, input] of [
      ["task_get", { id }],
      ["task_update", { id, note: "Hijacked" }],
      ["task_complete", { id }],
      ["task_reopen", { id }],
      ["task_archive", { id }],
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
      ...TIMES,
    };
    for (const extra of [
      { entityTypeId: secret.entityTypeId },
      { customerId: secretOrder.customerId, contactId: secretOrder.contactId },
      { contactId: secretOrder.contactId },
      { orderId: secretOrder.id },
    ]) {
      const created = await call({ client: b, name: "task_create", args: { ...base, ...extra } });
      refused({ code: created.data.code });
    }

    for (const input of [{ customerId: secretOrder.customerId }, { orderId: secretOrder.id }]) {
      const listed = await call({ client: b, name: "task_list", args: input });
      expect(listed.data.items, JSON.stringify(input)).toEqual([]);
    }

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
  });
});
