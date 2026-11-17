import { describe, expect, it } from "vitest";
import { archiveLine, type ExecuteContext, execute, unfollowAssignment } from "../src/index";
import { runReconciliations } from "../src/seed/demo/reconcile";
import { recordRelationsReconciliation } from "../src/seed/demo/record-relations-reconcile";
import { derivedSetup } from "./assignment-derived-helpers";
import { assignTo, followAs } from "./assignment-helpers";
import { unwrap } from "./helpers";

type Input = { context: ExecuteContext; recordId: string; responsibilityId?: string };

/** The active relations of one record's responsibility slot, as `principal relation source`. */
async function relations({ context, recordId, responsibilityId }: Input) {
  const rows = await context.db.recordRelation.findMany({
    where: { recordId, ...(responsibilityId ? { responsibilityId } : {}) },
    select: { principalId: true, relation: true, source: true },
  });
  return rows.map((row) => `${row.principalId} ${row.relation} ${row.source}`).sort();
}

const reconciled = async ({ context }: { context: ExecuteContext }) =>
  runReconciliations({ context, checks: [recordRelationsReconciliation] });

describe("record relations projection (ADR 0113)", () => {
  it("relates a responsibility's defaults to the orders its lines cover", async () => {
    const { context, order, erik, johan, slot } = await derivedSetup();
    const input = { context, recordId: order.id, responsibilityId: slot.responsibilityId };
    expect(await relations(input)).toEqual(
      [`${erik} ASSIGNEE DEFAULT`, `${johan} FOLLOWER DEFAULT`].sort(),
    );
    expect(await reconciled({ context })).toEqual([]);
  });

  it("relates the creating user, never SYSTEM", async () => {
    const { context, order } = await derivedSetup();
    const userId = context.actor.userId ?? "";
    expect(await relations({ context, recordId: order.id })).toContain(
      `${userId} CREATOR EXPLICIT`,
    );
  });

  it("follows a changed default and a removed line", async () => {
    const { context, order, maria, held, update, slot } = await derivedSetup();
    const input = { context, recordId: order.id, responsibilityId: slot.responsibilityId };
    unwrap({ result: await update({ defaultAssigneeId: maria, defaultFollowerIds: [] }) });
    expect(await relations(input)).toEqual([`${maria} ASSIGNEE DEFAULT`]);
    unwrap({ result: await execute({ operation: archiveLine, input: { id: held.id }, context }) });
    expect(await relations(input)).toEqual([]);
    expect(await reconciled({ context })).toEqual([]);
  });

  it("follows explicit choices: assignee, unfollow and follow", async () => {
    const { context, order, slot, erik, johan, maria } = await derivedSetup();
    const input = { context, recordId: order.id, responsibilityId: slot.responsibilityId };
    await assignTo({ context, ...slot, assigneeId: maria });
    unwrap({
      result: await execute({
        operation: unfollowAssignment,
        input: { ...slot, userId: johan },
        context,
      }),
    });
    await followAs({ context, ...slot, userId: erik });
    expect(await relations(input)).toEqual(
      [`${maria} ASSIGNEE EXPLICIT`, `${erik} FOLLOWER EXPLICIT`].sort(),
    );
    await assignTo({ context, ...slot, assigneeId: null });
    expect(await relations(input)).toContain(`${erik} ASSIGNEE DEFAULT`);
    expect(await reconciled({ context })).toEqual([]);
  });

  it("refuses writes from application code", async () => {
    const { context, order } = await derivedSetup();
    const data = { recordId: order.id, principalId: "x", relation: "FOLLOWER", source: "EXPLICIT" };
    await expect(context.db.recordRelation.create({ data: data as never })).rejects.toThrow(
      /written by triggers/,
    );
  });
});
