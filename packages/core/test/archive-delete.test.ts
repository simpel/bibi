import { describe, expect, it } from "vitest";
import {
  archiveContact,
  archiveCustomer,
  archiveTask,
  deleteCustomer,
  deleteTask,
  execute,
  getOrganizationProfile,
  getTask,
  restoreCustomer,
  restoreTask,
  updateOrganizationProfile,
} from "../src/index";
import { rowOf, runOk, runOn } from "./archive-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTask, taskSetup } from "./task-helpers";

describe("restoring and deleting archived records (ADR 0118)", () => {
  it("stamps archivedAt on archive and clears it on restore", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup }) });
    const active = await runOn({ operation: restoreTask, id: task.id, context });
    expect(errorCode({ result: active })).toBe("CONFLICT");
    await runOk({ operation: archiveTask, id: task.id, context });
    expect((await rowOf({ table: "Task", id: task.id }))?.archivedAt).toBeInstanceOf(Date);
    const restored = await runOk({ operation: restoreTask, id: task.id, context });
    expect(restored).toMatchObject({ id: task.id });
    expect(await rowOf({ table: "Task", id: task.id })).toEqual({
      status: "ACTIVE",
      archivedAt: null,
    });
    expect((await rowOf({ table: "Record", id: task.id }))?.status).toBe("ACTIVE");
  });

  it("deletes only an archived task, with its record row, and audits the last state", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup, note: "Tasting" }) });
    const active = await runOn({ operation: deleteTask, id: task.id, context });
    expect(errorCode({ result: active })).toBe("CONFLICT");
    await runOk({ operation: archiveTask, id: task.id, context });
    expect(await runOk({ operation: deleteTask, id: task.id, context })).toEqual({ id: task.id });
    expect(await rowOf({ table: "Task", id: task.id })).toBeNull();
    expect(await rowOf({ table: "Record", id: task.id })).toBeNull();
    const gone = await runOn({ operation: getTask, id: task.id, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const again = await runOn({ operation: deleteTask, id: task.id, context });
    expect(errorCode({ result: again })).toBe("NOT_FOUND");
    const audit = await context.db.auditLog.findFirst({ where: { operation: "task.delete" } });
    expect(audit).toMatchObject({ entityType: "task", entityId: task.id });
    expect(audit?.before).toMatchObject({ id: task.id, note: "Tasting", status: "ARCHIVED" });
  });

  it("refuses a customer while its tasks are left, then deletes it with its contacts", async () => {
    const setup = await taskSetup();
    const { context, other, otherContact } = setup;
    const task = unwrap({
      result: await addTask({ context, setup, customerId: other.id, contactId: otherContact.id }),
    });
    await runOk({ operation: archiveTask, id: task.id, context });
    await runOk({ operation: archiveContact, id: otherContact.id, context });
    const input = { id: other.id, archiveOrders: false };
    unwrap({ result: await execute({ operation: archiveCustomer, input, context }) });
    const restoreTaskFirst = await runOn({ operation: restoreTask, id: task.id, context });
    expect(errorCode({ result: restoreTaskFirst })).toBe("CONFLICT");
    const blocked = await runOn({ operation: deleteCustomer, id: other.id, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    expect(blocked.ok ? null : blocked.error.issues).toEqual([
      { path: "tasks", message: "Still used by 1 tasks" },
    ]);
    await runOk({ operation: deleteTask, id: task.id, context });
    await runOk({ operation: deleteCustomer, id: other.id, context });
    expect(await rowOf({ table: "Customer", id: other.id })).toBeNull();
    expect(
      await context.db.contact.count({
        where: { id: otherContact.id, status: { in: ["ACTIVE", "ARCHIVED"] } },
      }),
    ).toBe(0);
    expect(await rowOf({ table: "Record", id: otherContact.id })).toBeNull();
  });

  it("restores a customer only as itself", async () => {
    const setup = await taskSetup();
    const { context, other, otherContact } = setup;
    await runOk({ operation: archiveContact, id: otherContact.id, context });
    const input = { id: other.id, archiveOrders: false };
    unwrap({ result: await execute({ operation: archiveCustomer, input, context }) });
    const restored = await runOk({ operation: restoreCustomer, id: other.id, context });
    expect(restored).toMatchObject({ id: other.id, name: "Other AB" });
  });

  it("answers NOT_FOUND for another organization's ids", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup }) });
    await runOk({ operation: archiveTask, id: task.id, context });
    const stranger = testContext();
    for (const operation of [restoreTask, deleteTask]) {
      const result = await runOn({ operation, id: task.id, context: stranger });
      expect(errorCode({ result })).toBe("NOT_FOUND");
    }
    expect((await rowOf({ table: "Task", id: task.id }))?.status).toBe("ARCHIVED");
  });

  it("needs the feature's delete permission", async () => {
    const setup = await taskSetup();
    const { context } = setup;
    const task = unwrap({ result: await addTask({ context, setup }) });
    await runOk({ operation: archiveTask, id: task.id, context });
    const member = { ...testContext({ access: "read" }), organizationId: context.organizationId };
    const result = await runOn({
      operation: deleteTask,
      id: task.id,
      context: { ...context, permissions: member.permissions },
    });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});

describe("archive retention setting (ADR 0118)", () => {
  it("is 90 days by default and takes 1 to 180", async () => {
    const context = testContext();
    const profile = unwrap({
      result: await execute({ operation: getOrganizationProfile, input: {}, context }),
    });
    expect(profile.archiveRetentionDays).toBe(90);
    for (const days of [0, 181, 1.5]) {
      const input = { archiveRetentionDays: days };
      const result = await execute({ operation: updateOrganizationProfile, input, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
    const input = { archiveRetentionDays: 30 };
    const saved = unwrap({
      result: await execute({ operation: updateOrganizationProfile, input, context }),
    });
    expect(saved.archiveRetentionDays).toBe(30);
    const read = unwrap({
      result: await execute({ operation: getOrganizationProfile, input: {}, context }),
    });
    expect(read.archiveRetentionDays).toBe(30);
  });

  it("is changed by admins only", async () => {
    const context = testContext({ access: "write" });
    const input = { archiveRetentionDays: 30 };
    const result = await execute({ operation: updateOrganizationProfile, input, context });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});
