import { describe, expect, it } from "vitest";
import { createComment, execute, listRunSheets, updateComment } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addTestMemberWithUser } from "./org-helpers";
import { runSheetSetup } from "./run-sheet-helpers";

describe("run sheets show comments (ADR 0115)", () => {
  it("puts line comments on the line's row and order comments on the order row", async () => {
    const setup = await runSheetSetup();
    const { context, order, held, morning } = setup;
    const add = async ({ lineId, body }: { lineId?: string; body: string }) =>
      unwrap({
        result: await execute({
          operation: createComment,
          input: { orderId: order.id, body, ...(lineId ? { lineId } : {}) },
          context,
        }),
      });
    await add({ body: "Arrives by bus" });
    const onRoom = await add({ lineId: held.id, body: "Projector please" });
    await add({ lineId: morning.id, body: "Not on this run sheet" });
    const sheets = async () =>
      unwrap({
        result: await execute({ operation: listRunSheets, input: { orderId: order.id }, context }),
      }).items;
    const [latest] = await sheets();
    const row = ({ key }: { key: string }) =>
      latest?.content.rows.find((candidate) => candidate.key === key);
    expect(row({ key: order.id })?.comments.map((c) => c.body)).toEqual(["Arrives by bus"]);
    expect(row({ key: held.id })?.comments.map((c) => c.body)).toEqual(["Projector please"]);
    const versions = (await sheets()).length;
    unwrap({
      result: await execute({
        operation: updateComment,
        input: { id: onRoom.id, body: "Projector and flipchart" },
        context,
      }),
    });
    const after = await sheets();
    expect(after).toHaveLength(versions + 1);
    expect(after[0]?.content.rows.find((r) => r.key === held.id)?.comments[0]?.body).toBe(
      "Projector and flipchart",
    );
  });

  it("names the author when they are a member", async () => {
    const { context, order, held } = await runSheetSetup();
    const id = context.organizationId;
    const { userId } = await addTestMemberWithUser({ context, role: "member", name: "Kim Berg" });
    const kim = testContext({
      organizationId: id,
      access: "read",
      actor: { type: "user", userId },
    });
    const input = { orderId: order.id, lineId: held.id, body: "Allergy list attached" };
    const comment = unwrap({
      result: await execute({ operation: createComment, input, context: kim }),
    });
    expect(comment.authorName).toBe("Kim Berg");
    const [latest] = unwrap({
      result: await execute({ operation: listRunSheets, input: { orderId: order.id }, context }),
    }).items;
    const row = latest?.content.rows.find((candidate) => candidate.key === held.id);
    expect(row?.comments).toEqual([
      { body: "Allergy list attached", authorName: "Kim Berg", createdAt: expect.any(String) },
    ]);
  });
});
