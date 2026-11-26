import { describe, expect, it } from "vitest";
import { archiveContact, archiveCustomer, archiveTask, execute, listArchived } from "../src/index";
import { runOk } from "./archive-helpers";
import { testContext, unwrap } from "./helpers";
import { addTask, taskSetup } from "./task-helpers";

const DAY_MS = 86_400_000;

describe("the Archive page (archive.list, ADR 0118)", () => {
  it("lists archived records of every kind with their delete date, filtered by kind and text", async () => {
    const setup = await taskSetup();
    const { context, other, otherContact } = setup;
    const task = unwrap({
      result: await addTask({ context, setup, contactId: setup.contact.id }),
    });
    await runOk({ operation: archiveTask, id: task.id, context });
    await runOk({ operation: archiveContact, id: otherContact.id, context });
    const archive = { id: other.id, archiveOrders: false };
    unwrap({ result: await execute({ operation: archiveCustomer, input: archive, context }) });

    const all = unwrap({ result: await execute({ operation: listArchived, input: {}, context }) });
    expect(all.retentionDays).toBe(90);
    expect(all.truncated).toBe(false);
    const customer = all.items.find((item) => item.id === other.id);
    expect(customer).toMatchObject({
      kind: "customer",
      name: "Other AB",
      restoreOperation: "customer.restore",
      deleteOperation: "customer.delete",
    });
    expect(customer?.deletesAt?.getTime()).toBe(
      (customer?.archivedAt?.getTime() ?? 0) + 90 * DAY_MS,
    );
    const archivedTask = all.items.find((item) => item.id === task.id);
    expect(archivedTask).toMatchObject({
      kind: "task",
      name: `Site visit · ${setup.customer.name}`,
    });
    // Newest archived first.
    const times = all.items.map((item) => item.archivedAt?.getTime() ?? 0);
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const tasks = unwrap({
      result: await execute({ operation: listArchived, input: { kind: "task" }, context }),
    });
    expect(tasks.items.map((item) => item.id)).toEqual([task.id]);
    const byText = unwrap({
      result: await execute({ operation: listArchived, input: { query: "other ab" }, context }),
    });
    expect(byText.items.map((item) => item.id)).toEqual([other.id]);
  });

  it("shows nothing the caller may not restore and delete", async () => {
    const setup = await taskSetup();
    const { context, other, otherContact } = setup;
    await runOk({ operation: archiveContact, id: otherContact.id, context });
    const archive = { id: other.id, archiveOrders: false };
    unwrap({ result: await execute({ operation: archiveCustomer, input: archive, context }) });
    const reader = testContext({ organizationId: context.organizationId, access: "read" });
    const seen = unwrap({
      result: await execute({ operation: listArchived, input: {}, context: reader }),
    });
    expect(seen.items).toEqual([]);
  });
});
