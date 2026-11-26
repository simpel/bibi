import { describe, expect, it } from "vitest";
import {
  archiveContact,
  archiveCustomer,
  archiveTask,
  createSystemContext,
  execute,
  listExpiredArchives,
  purgeExpiredArchives,
  updateOrganizationProfile,
} from "../src/index";
import { backdate, rowOf, runOk } from "./archive-helpers";
import { errorCode, unwrap } from "./helpers";
import { addTask, taskSetup } from "./task-helpers";

describe("the archive retention job (ADR 0118)", () => {
  it("deletes what passed the retention and skips what is still in use", async () => {
    const setup = await taskSetup();
    const { context, other, otherContact } = setup;
    const input = { archiveRetentionDays: 30 };
    unwrap({ result: await execute({ operation: updateOrganizationProfile, input, context }) });
    const [expired, recent, active] = await Promise.all(
      [setup.contact.id, otherContact.id, setup.contact.id].map(async (contactId, index) =>
        unwrap({
          result: await addTask({
            ...{ context, setup, contactId },
            customerId: index === 1 ? other.id : setup.customer.id,
          }),
        }),
      ),
    );
    if (!expired || !recent || !active) throw new Error("tasks missing");
    for (const task of [expired, recent])
      await runOk({ operation: archiveTask, id: task.id, context });
    await backdate({ table: "Task", id: expired.id, days: 31 });
    await backdate({ table: "Task", id: recent.id, days: 10 });
    await runOk({ operation: archiveContact, id: otherContact.id, context });
    const archive = { id: other.id, archiveOrders: false };
    unwrap({ result: await execute({ operation: archiveCustomer, input: archive, context }) });
    await backdate({ table: "Customer", id: other.id, days: 31 });

    const system = createSystemContext({ organizationId: context.organizationId });
    const due = unwrap({
      result: await execute({ operation: listExpiredArchives, input: {}, context: system }),
    });
    expect(due.items).toEqual([
      { operation: "task.delete", id: expired.id },
      { operation: "customer.delete", id: other.id },
    ]);
    const purged = unwrap({ result: await purgeExpiredArchives({ context: system }) });
    expect(purged).toEqual({ deleted: 1, skipped: 1, failed: 0 });
    expect(await rowOf({ table: "Task", id: expired.id })).toBeNull();
    expect((await rowOf({ table: "Task", id: recent.id }))?.status).toBe("ARCHIVED");
    expect((await rowOf({ table: "Task", id: active.id }))?.status).toBe("ACTIVE");
    expect((await rowOf({ table: "Customer", id: other.id }))?.status).toBe("ARCHIVED");
    const audit = await context.db.auditLog.findFirst({ where: { operation: "task.delete" } });
    expect(audit).toMatchObject({ entityId: expired.id, actorType: "SYSTEM" });
  });

  it("is run by the system only", async () => {
    const { context } = await taskSetup();
    const result = await execute({ operation: listExpiredArchives, input: {}, context });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});
