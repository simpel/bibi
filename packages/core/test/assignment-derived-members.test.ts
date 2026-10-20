import { describe, expect, it } from "vitest";
import {
  execute,
  generateSheet,
  listMyAssignments,
  listTickets,
  sendSheet,
  unfollowAssignment,
} from "../src/index";
import { asUser, derivedSetup } from "./assignment-derived-helpers";
import { assignTo } from "./assignment-helpers";
import { unwrap } from "./helpers";

describe("derived assignments for members and sheets (ADR 0055)", () => {
  it("lists derived slots in listMine and the ticket filters, minus explicit choices", async () => {
    const { context, ticket, slot, erik, johan, maria } = await derivedSetup();
    const mine = async ({ userId, kind }: { userId: string; kind: "ASSIGNED" | "FOLLOWING" }) =>
      unwrap({
        result: await execute({
          operation: listMyAssignments,
          input: { kind, limit: 50 },
          context: asUser({ context, userId }),
        }),
      }).items;
    const byErik = await mine({ userId: erik, kind: "ASSIGNED" });
    expect(byErik.map((row) => row.subjectId)).toEqual([ticket.id]);
    expect(byErik[0]).toMatchObject({ responsibilityId: slot.responsibilityId, id: null });
    expect(await mine({ userId: johan, kind: "FOLLOWING" })).toHaveLength(1);
    const filter = async ({ ...input }: { assigneeId: string } | { followerId: string }) =>
      unwrap({
        result: await execute({ operation: listTickets, input: { limit: 50, ...input }, context }),
      }).items.map((row) => row.id);
    expect(await filter({ assigneeId: erik })).toEqual([ticket.id]);
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

  it("snapshots the recipients when a sheet is sent", async () => {
    const setup2 = await derivedSetup();
    const { context, ticket, definition, erik, johan, maria, update } = setup2;
    const input = { ticketId: ticket.id, sheetDefinitionId: definition.id };
    const sheet = unwrap({ result: await execute({ operation: generateSheet, input, context }) });
    expect(sheet.recipients).toEqual([]);
    const sent = unwrap({
      result: await execute({ operation: sendSheet, input: { id: sheet.id }, context }),
    });
    expect(sent.recipients).toEqual([
      { userId: erik, role: "ASSIGNEE" },
      { userId: johan, role: "FOLLOWER" },
    ]);
    unwrap({ result: await update({ defaultAssigneeId: maria }) });
    const stored = await context.db.sheet.findFirstOrThrow({
      where: { id: sheet.id },
      include: { recipients: { select: { userId: true, role: true } } },
    });
    expect(stored.recipients.map((r) => r.userId)).toEqual([erik, johan]);
  });
});
