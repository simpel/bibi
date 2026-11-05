import { describe, expect, it } from "vitest";
import {
  changeOrderStatus,
  createLine,
  execute,
  setOrderStatusGates,
  setOrderStatusTransitions,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { insertHold } from "./hold-helpers";
import { activeOccupancies } from "./line-helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { createTestOrder, memberUser, moveToStatus, orderSetup } from "./order-helpers";
import { statusByName } from "./order-status-helpers";
import { testOrg } from "./org-helpers";

async function leadSetup({ assigned = false }: { assigned?: boolean } = {}) {
  const setup = await orderSetup();
  const { context, type, customer } = setup;
  const assigneeId = assigned ? await memberUser({ context, name: "Johan Ek" }) : undefined;
  const order = await createTestOrder({
    context,
    entityTypeId: type.id,
    customerId: customer.id,
    ...(assigneeId ? { assigneeId } : {}),
  });
  return { ...setup, order };
}

describe("order.changeStatus (ADR 0043)", () => {
  it("moves along an allowed transition and audits the change", async () => {
    const { context, order } = await leadSetup({ assigned: true });
    const moved = unwrap({
      result: await moveToStatus({ context, orderId: order.id, name: "Confirmed" }),
    });
    const confirmed = await statusByName({ context, name: "Confirmed" });
    expect(moved).toMatchObject({ statusId: confirmed.id, statusReason: null });
    expect(moved.statusChangedAt.getTime()).toBeGreaterThanOrEqual(order.statusChangedAt.getTime());
    const audit = await context.db.auditLog.findFirstOrThrow({
      where: { entityId: order.id, operation: "order.changeStatus" },
    });
    expect(audit.before).toMatchObject({ statusId: order.statusId });
    expect(audit.after).toMatchObject({ statusId: confirmed.id });
  });

  it("lists every failing gate of a refused move and changes nothing", async () => {
    const { context, order } = await leadSetup();
    const confirmed = await statusByName({ context, name: "Confirmed" });
    const lead = await statusByName({ context, name: "Lead" });
    const gates = [{ fromStatusId: null, gates: ["REASON" as const, "ASSIGNEE" as const] }];
    const input = { id: confirmed.id, gates };
    unwrap({ result: await execute({ operation: setOrderStatusGates, input, context }) });
    const refused = await moveToStatus({ context, orderId: order.id, name: "Confirmed" });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const paths = refused.ok ? [] : refused.error.issues.map((issue) => issue.path);
    expect(paths).toEqual(["reason", "assigneeId"]);
    const after = await context.db.order.findFirstOrThrow({ where: { id: order.id } });
    expect(after.statusId).toBe(lead.id);
  });

  it("refuses a move the organization does not allow", async () => {
    const { context, order } = await leadSetup();
    const lead = await statusByName({ context, name: "Lead" });
    const input = { id: lead.id, allowedNext: "ONLY_THESE" as const, toStatusIds: [] };
    unwrap({ result: await execute({ operation: setOrderStatusTransitions, input, context }) });
    const refused = await moveToStatus({ context, orderId: order.id, name: "Confirmed" });
    expect(refused.ok ? [] : refused.error.issues.map((issue) => issue.path)).toContain("statusId");
  });

  it("needs a reason for Lost and an assignee for Completed", async () => {
    const { context, order } = await leadSetup();
    const noReason = await moveToStatus({ context, orderId: order.id, name: "Lost" });
    expect(noReason.ok ? null : noReason.error.issues.map((issue) => issue.path)).toEqual([
      "reason",
    ]);
    const noAssignee = await moveToStatus({ context, orderId: order.id, name: "Completed" });
    expect(noAssignee.ok ? null : noAssignee.error.issues[0]?.path).toBe("assigneeId");
    const lost = unwrap({
      result: await moveToStatus({ context, orderId: order.id, name: "Lost", reason: "Price" }),
    });
    expect(lost.statusReason).toBe("Price");
  });

  it("never leaves a closing status, even with a stray transition row", async () => {
    const { context, order } = await leadSetup();
    unwrap({
      result: await moveToStatus({ context, orderId: order.id, name: "Lost", reason: "x" }),
    });
    const lost = await statusByName({ context, name: "Lost" });
    const lead = await statusByName({ context, name: "Lead" });
    await context.db.orderStatusTransition.create({
      data: { organizationId: context.organizationId, fromStatusId: lost.id, toStatusId: lead.id },
    });
    const reopened = await moveToStatus({ context, orderId: order.id, name: "Lead" });
    expect(errorCode({ result: reopened })).toBe("CONFLICT");
  });

  it("drops the line holds of an order that enters a closing status (ADR 0053)", async () => {
    const { context, order } = await leadSetup();
    const item = await createBookableItem({ context });
    // The room type has no released state, so only the closing status releases the hold.
    const other = await insertHold({ context, itemId: item.id, hold: "SOFT", from: 9, to: 12 });
    const lineType = await context.db.entityType.findFirstOrThrow({ where: { base: "LINE" } });
    const input = { orderId: order.id, entityTypeId: lineType.id, itemId: item.id, name: "Talk" };
    const line = unwrap({
      result: await execute({
        operation: createLine,
        input: { ...input, ...hours({ from: 13, to: 15 }) },
        context,
      }),
    });
    expect(await activeOccupancies({ context, lineId: line.id })).toHaveLength(1);
    unwrap({
      result: await moveToStatus({ context, orderId: order.id, name: "Lost", reason: "Online" }),
    });
    expect(await activeOccupancies({ context, lineId: line.id })).toEqual([]);
    const kept = await context.db.occupancy.findFirst({ where: { id: other.id } });
    expect(kept?.status).toBe("ACTIVE");
  });

  it("refuses unknown and foreign ids", async () => {
    const { context, order } = await leadSetup();
    const other = await orderSetup();
    const foreign = await statusByName({ context: other.context, name: "Lost" });
    type ChangeInput = { input: Record<string, unknown>; ctx?: typeof context };
    const change = ({ input, ctx = context }: ChangeInput) =>
      execute({ operation: changeOrderStatus, input, context: ctx });
    const withForeign = await change({
      input: { orderId: order.id, statusId: foreign.id, reason: "x" },
    });
    expect(errorCode({ result: withForeign })).toBe("VALIDATION");
    const lost = await statusByName({ context, name: "Lost" });
    expect(
      errorCode({ result: await change({ input: { orderId: "nope", statusId: lost.id } }) }),
    ).toBe("NOT_FOUND");
    const outside = await change({
      input: { orderId: order.id, statusId: lost.id, reason: "x" },
      ctx: await testOrg(),
    });
    expect(errorCode({ result: outside })).toBe("NOT_FOUND");
    const same = await change({ input: { orderId: order.id, statusId: order.statusId } });
    expect(errorCode({ result: same })).toBe("CONFLICT");
  });
});
