import { describe, expect, it } from "vitest";
import {
  type CommentCreateInput,
  createComment,
  execute,
  listRunSheets,
  updateComment,
} from "../src/index";
import { derivedSetup } from "./assignment-derived-helpers";
import { assignTo, orderSubject } from "./assignment-helpers";
import { errorCode, unwrap } from "./helpers";
import { asMember, notificationsOf, readingMember } from "./notification-helpers";
import { requirementSetup } from "./requirement-helpers";
import { runSheetSetup } from "./run-sheet-helpers";

describe("comment replies and mentions (ADR 0115)", () => {
  it("replies one level, on the parent's order and line", async () => {
    const { context, order, morning } = await requirementSetup();
    const other = await requirementSetup();
    const add = ({ input }: { input: CommentCreateInput }) =>
      execute({ operation: createComment, input, context });
    const top = unwrap({
      result: await add({ input: { orderId: order.id, lineId: morning.id, body: "Q?" } }),
    });
    const reply = unwrap({
      result: await add({ input: { orderId: order.id, parentCommentId: top.id, body: "A." } }),
    });
    expect(reply).toMatchObject({ parentCommentId: top.id, lineId: morning.id });
    const deeper = await add({
      input: { orderId: order.id, parentCommentId: reply.id, body: "x" },
    });
    expect(errorCode({ result: deeper })).toBe("VALIDATION");
    const elsewhere = await add({
      input: { orderId: other.order.id, parentCommentId: top.id, body: "x" },
    });
    expect(errorCode({ result: elsewhere })).toBe("VALIDATION");
  });

  it("mentions members only, tells them, and tells newly mentioned ones on edit", async () => {
    const { context, order } = await derivedSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const kim = await readingMember({ context, name: "Kim Lind" });
    const lo = await readingMember({ context, name: "Lo Ek" });
    await assignTo({ context, ...orderSubject(order), assigneeId: anna });
    const asKim = asMember({ context, userId: kim });
    const stranger = await execute({
      operation: createComment,
      input: { orderId: order.id, body: "@Ghost", mentionUserIds: ["user_ghost"] },
      context: asKim,
    });
    expect(errorCode({ result: stranger })).toBe("VALIDATION");
    const input = { orderId: order.id, body: "@Anna Berg can you check?", mentionUserIds: [anna] };
    const made = unwrap({
      result: await execute({ operation: createComment, input, context: asKim }),
    });
    expect(made.mentions).toEqual([{ userId: anna, name: "Anna Berg" }]);
    const kinds = async ({ userId }: { userId: string }) =>
      (await notificationsOf({ context, userId, input: { orderId: order.id } })).items
        .map((n) => n.kind)
        .filter((kind) => kind.startsWith("COMMENT_"));
    // Anna is on the order and mentioned: one mention, not also "comment added".
    expect(await kinds({ userId: anna })).toEqual(["COMMENT_MENTIONED"]);
    expect(await kinds({ userId: lo })).toEqual([]);
    const edit = {
      id: made.id,
      body: "@Anna Berg @Lo Ek can you check?",
      mentionUserIds: [anna, lo],
    };
    unwrap({ result: await execute({ operation: updateComment, input: edit, context: asKim }) });
    expect(await kinds({ userId: lo })).toEqual(["COMMENT_MENTIONED"]);
    expect(await kinds({ userId: anna })).toEqual(["COMMENT_MENTIONED"]);
  });

  it("tells the author of the comment a reply answers", async () => {
    const { context, order } = await derivedSetup();
    const anna = await readingMember({ context, name: "Anna Berg" });
    const kim = await readingMember({ context, name: "Kim Lind" });
    const top = unwrap({
      result: await execute({
        operation: createComment,
        input: { orderId: order.id, body: "Who brings the cake?" },
        context: asMember({ context, userId: anna }),
      }),
    });
    unwrap({
      result: await execute({
        operation: createComment,
        input: { orderId: order.id, parentCommentId: top.id, body: "I do" },
        context: asMember({ context, userId: kim }),
      }),
    });
    const { items } = await notificationsOf({
      context,
      userId: anna,
      input: { orderId: order.id },
    });
    expect(items.map((n) => [n.kind, n.data.reply])).toEqual([["COMMENT_ADDED", true]]);
  });

  it("puts a reply right after its comment on the run sheet", async () => {
    const { context, order, held } = await runSheetSetup();
    const add = async ({ ...input }: { body: string; parentCommentId?: string }) =>
      unwrap({
        result: await execute({
          operation: createComment,
          input: { orderId: order.id, lineId: input.parentCommentId ? null : held.id, ...input },
          context,
        }),
      });
    const first = await add({ body: "Projector?" });
    await add({ body: "Flipchart too" });
    await add({ body: "Yes, booked", parentCommentId: first.id });
    const [latest] = unwrap({
      result: await execute({ operation: listRunSheets, input: { orderId: order.id }, context }),
    }).items;
    const row = latest?.content.rows.find((candidate) => candidate.key === held.id);
    expect(row?.comments.map((c) => [c.body, c.reply])).toEqual([
      ["Projector?", false],
      ["Yes, booked", true],
      ["Flipchart too", false],
    ]);
  });
});
