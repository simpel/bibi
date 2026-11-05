import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  changeOrderStatus,
  countUnreadNotifications,
  execute,
  generateRunSheet,
  markAllNotificationsRead,
  markNotificationsRead,
  sendRunSheet,
  setNotificationPreference,
} from "../src/index";
import { derivedSetup } from "./assignment-derived-helpers";
import { assignTo, orderSubject } from "./assignment-helpers";
import { testContext, unwrap } from "./helpers";
import { asMember, makeReaders, notificationsOf, readingMember } from "./notification-helpers";
import { statusByName } from "./order-status-helpers";

describe("notifications (ADR 0094)", () => {
  it("tells the new assignee, with a snapshot of the order, but never the actor", async () => {
    const { context, order } = await derivedSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    await assignTo({ context, ...orderSubject(order), assigneeId: anna });
    const { items } = await notificationsOf({ context, userId: anna });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "ASSIGNED", orderId: order.id, readAt: null });
    expect(items[0]?.data.orderReference).toBe(order.reference);
    const self = testContext({
      organizationId: context.organizationId,
      access: "write",
      actor: { type: "user", userId: anna },
    });
    await assignTo({ context: self, ...orderSubject(order), assigneeId: anna });
    expect((await notificationsOf({ context, userId: anna })).items).toHaveLength(1);
  });

  it("skips members who turned the kind off or may not read orders", async () => {
    const { context, order } = await derivedSetup();
    const off = await readingMember({ context, name: "Off Person" });
    unwrap({
      result: await execute({
        operation: setNotificationPreference,
        input: { kind: "ASSIGNED", enabled: false },
        context: asMember({ context, userId: off }),
      }),
    });
    await assignTo({ context, ...orderSubject(order), assigneeId: off });
    expect((await notificationsOf({ context, userId: off })).items).toEqual([]);
    const blind = await readingMember({ context, name: "Blind Person" });
    const member = await getDb().member.findFirstOrThrow({ where: { userId: blind } });
    await getDb().permissionOverride.create({
      data: {
        organizationId: context.organizationId,
        subjectType: "MEMBER",
        subjectId: member.id,
        feature: "order",
        action: "read",
        effect: "DENY",
      },
    });
    await assignTo({ context, ...orderSubject(order), assigneeId: blind });
    expect((await notificationsOf({ context, userId: blind })).items).toEqual([]);
  });

  it("tells everyone on the order about a status change and the recipients of a run sheet", async () => {
    const { context, order, definition, erik, johan } = await derivedSetup();
    await makeReaders({ context, userIds: [erik, johan] });
    const lost = await statusByName({ context, name: "Lost" });
    const move = { orderId: order.id, statusId: lost.id, reason: "Went elsewhere" };
    const input = { orderId: order.id, runSheetDefinitionId: definition.id };
    const runSheet = unwrap({
      result: await execute({ operation: generateRunSheet, input, context }),
    });
    unwrap({
      result: await execute({ operation: sendRunSheet, input: { id: runSheet.id }, context }),
    });
    unwrap({ result: await execute({ operation: changeOrderStatus, input: move, context }) });
    for (const userId of [erik, johan]) {
      const kinds = (await notificationsOf({ context, userId })).items.map((item) => item.kind);
      expect(kinds.sort()).toEqual(["ORDER_STATUS_CHANGED", "RUN_SHEET_SENT"]);
    }
    const { items } = await notificationsOf({
      context,
      userId: erik,
      input: { kind: "ORDER_STATUS_CHANGED" },
    });
    expect(items[0]?.data).toMatchObject({ fromStatus: "Lead", toStatus: "Lost" });
  });

  it("pages, filters and marks only the caller's own notifications", async () => {
    const { context, order } = await derivedSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const bo = await readingMember({ context, name: "Bo Ek" });
    for (const assigneeId of [anna, bo, anna, bo, anna]) {
      await assignTo({ context, ...orderSubject(order), assigneeId });
    }
    const first = await notificationsOf({ context, userId: anna, input: { page: 1, limit: 2 } });
    expect([first.items.length, first.total]).toEqual([2, 3]);
    const annas = asMember({ context, userId: anna });
    const bos = (await notificationsOf({ context, userId: bo })).items.map((item) => item.id);
    const stolen = await execute({
      operation: markNotificationsRead,
      input: { ids: bos },
      context: annas,
    });
    expect(unwrap({ result: stolen }).updated).toBe(0);
    const ids = first.items.map((item) => item.id);
    const marked = await execute({
      operation: markNotificationsRead,
      input: { ids },
      context: annas,
    });
    expect(unwrap({ result: marked })).toEqual({ updated: 2, unread: 1 });
    expect(
      (await notificationsOf({ context, userId: anna, input: { read: "unread" } })).items,
    ).toHaveLength(1);
    unwrap({
      result: await execute({ operation: markAllNotificationsRead, input: {}, context: annas }),
    });
    const count = await execute({ operation: countUnreadNotifications, input: {}, context: annas });
    expect(unwrap({ result: count }).unread).toBe(0);
    expect(
      (await notificationsOf({ context, userId: bo, input: { read: "unread" } })).items,
    ).toHaveLength(2);
  });
});
