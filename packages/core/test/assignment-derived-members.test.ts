import { describe, expect, it } from "vitest";
import {
  execute,
  generateRunSheet,
  listMyAssignments,
  listOrders,
  sendRunSheet,
  unfollowAssignment,
} from "../src/index";
import { asUser, derivedSetup } from "./assignment-derived-helpers";
import { assignTo } from "./assignment-helpers";
import { unwrap } from "./helpers";

describe("derived assignments for members and run sheets (ADR 0055)", () => {
  it("lists derived slots in listMine and the order filters, minus explicit choices", async () => {
    const { context, order, slot, erik, johan, maria } = await derivedSetup();
    const mine = async ({ userId, kind }: { userId: string; kind: "ASSIGNED" | "FOLLOWING" }) =>
      unwrap({
        result: await execute({
          operation: listMyAssignments,
          input: { kind, limit: 50 },
          context: asUser({ context, userId }),
        }),
      }).items;
    const byErik = await mine({ userId: erik, kind: "ASSIGNED" });
    expect(byErik.map((row) => row.subjectId)).toEqual([order.id]);
    expect(byErik[0]).toMatchObject({ responsibilityId: slot.responsibilityId, id: null });
    expect(await mine({ userId: johan, kind: "FOLLOWING" })).toHaveLength(1);
    const filter = async ({ ...input }: { assigneeId: string } | { followerId: string }) =>
      unwrap({
        result: await execute({ operation: listOrders, input: { limit: 50, ...input }, context }),
      }).items.map((row) => row.id);
    expect(await filter({ assigneeId: erik })).toEqual([order.id]);
    await assignTo({ context, ...slot, assigneeId: maria });
    unwrap({
      result: await execute({
        operation: unfollowAssignment,
        input: { ...slot, userId: johan },
        context,
      }),
    });
    expect(await mine({ userId: erik, kind: "ASSIGNED" })).toEqual([]);
    expect(
      (await mine({ userId: maria, kind: "ASSIGNED" })).map((row) => row.assigneeSource),
    ).toEqual(["EXPLICIT"]);
    expect(await mine({ userId: johan, kind: "FOLLOWING" })).toEqual([]);
    expect(await filter({ assigneeId: erik })).toEqual([]);
    expect(await filter({ followerId: johan })).toEqual([]);
  });

  it("snapshots the recipients when a run sheet is sent", async () => {
    const setup2 = await derivedSetup();
    const { context, order, definition, erik, johan, maria, update } = setup2;
    const input = { orderId: order.id, runSheetDefinitionId: definition.id };
    const runSheet = unwrap({
      result: await execute({ operation: generateRunSheet, input, context }),
    });
    expect(runSheet.recipients).toEqual([]);
    const sent = unwrap({
      result: await execute({ operation: sendRunSheet, input: { id: runSheet.id }, context }),
    });
    expect(sent.recipients).toEqual([
      { userId: erik, role: "ASSIGNEE" },
      { userId: johan, role: "FOLLOWER" },
    ]);
    unwrap({ result: await update({ defaultAssigneeId: maria }) });
    const stored = await context.db.runSheet.findFirstOrThrow({
      where: { id: runSheet.id },
      include: {
        recipients: { select: { userId: true, role: true }, orderBy: { position: "asc" } },
      },
    });
    expect(stored.recipients.map((r) => r.userId)).toEqual([erik, johan]);
  });
});
