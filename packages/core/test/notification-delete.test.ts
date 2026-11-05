import { describe, expect, it } from "vitest";
import { deleteNotifications, execute } from "../src/index";
import { derivedSetup } from "./assignment-derived-helpers";
import { assignTo, orderSubject } from "./assignment-helpers";
import { unwrap } from "./helpers";
import { asMember, notificationsOf, readingMember } from "./notification-helpers";

describe("deleting notifications (ADR 0094)", () => {
  it("deletes only the caller's own notifications", async () => {
    const { context, order } = await derivedSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const bo = await readingMember({ context, name: "Bo Ek" });
    for (const assigneeId of [anna, bo]) {
      await assignTo({ context, ...orderSubject(order), assigneeId });
    }
    const annas = asMember({ context, userId: anna });
    const bos = (await notificationsOf({ context, userId: bo })).items.map((item) => item.id);
    const stolen = await execute({
      operation: deleteNotifications,
      input: { ids: bos },
      context: annas,
    });
    expect(unwrap({ result: stolen }).deleted).toBe(0);
    const own = (await notificationsOf({ context, userId: anna })).items.map((item) => item.id);
    const deleted = await execute({
      operation: deleteNotifications,
      input: { ids: own },
      context: annas,
    });
    expect(unwrap({ result: deleted })).toEqual({ deleted: own.length, unread: 0 });
    expect((await notificationsOf({ context, userId: anna })).items).toHaveLength(0);
    expect((await notificationsOf({ context, userId: bo })).items).toHaveLength(bos.length);
  });
});
