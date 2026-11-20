import { describe, expect, it } from "vitest";
import { createComment, execute, markNotificationsRead } from "../src/index";
import { derivedSetup } from "./assignment-derived-helpers";
import { assignTo, orderSubject } from "./assignment-helpers";
import { unwrap } from "./helpers";
import { asMember, notificationsOf, readingMember } from "./notification-helpers";

describe("comment notifications (ADR 0115)", () => {
  it("tells each person on the order, never the author, and each reads their own", async () => {
    const { context, order } = await derivedSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const kim = await readingMember({ context, name: "Kim Lind" });
    await assignTo({ context, ...orderSubject(order), assigneeId: anna });
    // Kim comments; Anna answers for the order and is told, Kim (the author) is not.
    const input = { orderId: order.id, body: "Projector needed in the morning" };
    unwrap({
      result: await execute({
        operation: createComment,
        input,
        context: asMember({ context, userId: kim }),
      }),
    });
    const kind = "COMMENT_ADDED" as const;
    const annas = await notificationsOf({
      context,
      userId: anna,
      input: { kind, orderId: order.id },
    });
    expect(annas.items).toHaveLength(1);
    expect(annas.items[0]?.data).toMatchObject({
      lineId: null,
      excerpt: input.body,
      actorName: "Kim Lind",
    });
    expect((await notificationsOf({ context, userId: kim, input: { kind } })).items).toEqual([]);
    const ids = annas.items.map((item) => item.id);
    unwrap({
      result: await execute({
        operation: markNotificationsRead,
        input: { ids },
        context: asMember({ context, userId: anna }),
      }),
    });
    const unread = await notificationsOf({
      context,
      userId: anna,
      input: { kind, read: "unread" },
    });
    expect(unread.items).toEqual([]);
  });
});
