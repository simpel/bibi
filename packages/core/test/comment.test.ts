import { describe, expect, it } from "vitest";
import {
  archiveComment,
  type CommentCreateInput,
  createComment,
  type ExecuteContext,
  execute,
  getComment,
  listComments,
  updateComment,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { requirementSetup } from "./requirement-helpers";

type AddInput = { context: ExecuteContext } & CommentCreateInput;

const add = ({ context, ...input }: AddInput) =>
  execute({ operation: createComment, input, context });

describe("comments on orders and lines (ADR 0115)", () => {
  it("adds comments to the order and a line and lists them oldest first", async () => {
    const { context, order, morning } = await requirementSetup();
    const onOrder = unwrap({ result: await add({ context, orderId: order.id, body: "VIP" }) });
    const onLine = unwrap({
      result: await add({ context, orderId: order.id, lineId: morning.id, body: "No onions" }),
    });
    expect(onOrder).toMatchObject({ lineId: null, body: "VIP", editedAt: null });
    expect(onLine).toMatchObject({ lineId: morning.id, createdBy: context.actor.userId });
    const list = async ({ lineId }: { lineId?: string | null } = {}) =>
      unwrap({
        result: await execute({
          operation: listComments,
          input: { orderId: order.id, ...(lineId === undefined ? {} : { lineId }) },
          context,
        }),
      }).items.map((row) => row.body);
    expect(await list()).toEqual(["VIP", "No onions"]);
    expect(await list({ lineId: null })).toEqual(["VIP"]);
    expect(await list({ lineId: morning.id })).toEqual(["No onions"]);
  });

  it("refuses a line of another order", async () => {
    const { context, order } = await requirementSetup();
    const other = await requirementSetup();
    const result = await add({ context, orderId: order.id, lineId: other.morning.id, body: "x" });
    expect(errorCode({ result })).toBe("VALIDATION");
  });

  it("lets only the author edit; others' archive needs comment:delete", async () => {
    const { context, order } = await requirementSetup();
    const mine = unwrap({ result: await add({ context, orderId: order.id, body: "Draft" }) });
    const member = peer({ of: context, access: "read" });
    const edit = { id: mine.id, body: "Changed" };
    const byOther = await execute({ operation: updateComment, input: edit, context: member });
    expect(errorCode({ result: byOther })).toBe("NOT_FOUND");
    const archiveByMember = await execute({
      operation: archiveComment,
      input: { id: mine.id },
      context: member,
    });
    expect(errorCode({ result: archiveByMember })).toBe("NOT_FOUND");
    const edited = unwrap({
      result: await execute({ operation: updateComment, input: edit, context }),
    });
    expect(edited.body).toBe("Changed");
    expect(edited.editedAt).toBeInstanceOf(Date);
    const manager = peer({ of: context, access: "write" });
    const input = { id: mine.id };
    unwrap({ result: await execute({ operation: archiveComment, input, context: manager }) });
    const gone = await execute({ operation: getComment, input, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("lets a member comment and archive their own comment", async () => {
    const { context, order } = await requirementSetup();
    const member = peer({ of: context, access: "read" });
    const own = unwrap({ result: await add({ context: member, orderId: order.id, body: "Hi" }) });
    const input = { id: own.id };
    unwrap({ result: await execute({ operation: archiveComment, input, context: member }) });
  });

  it("keeps another organization's order and comments out of reach", async () => {
    const { context, order } = await requirementSetup();
    const mine = unwrap({ result: await add({ context, orderId: order.id, body: "Secret" }) });
    const stranger = testContext();
    const onOrder = await add({ context: stranger, orderId: order.id, body: "x" });
    expect(errorCode({ result: onOrder })).toBe("VALIDATION");
    const read = await execute({
      operation: getComment,
      input: { id: mine.id },
      context: stranger,
    });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
  });
});
