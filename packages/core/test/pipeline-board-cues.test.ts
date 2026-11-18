import { describe, expect, it } from "vitest";
import {
  type ExecuteContext,
  execute,
  followAssignment,
  pipelineBoard,
  pipelineCues,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { bookRoom, previewSetup } from "./preview-helpers";
import { addLine } from "./status-grid-helpers";

const board = async ({ context }: { context: ExecuteContext }) =>
  unwrap({ result: await execute({ operation: pipelineBoard, input: {}, context }) });

/** The same organization seen by `userId`. */
const as = ({ context, userId }: { context: ExecuteContext; userId: string }) =>
  testContext({ organizationId: context.organizationId, actor: { type: "user", userId } });

describe("pipeline.board cues (spec: boards, home Tone)", () => {
  it("flags a soft hold another order's hard hold overlaps", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const order = await setup.newOrder();
    await addLine({ setup, orderId: order.id, itemId: room.id, from: 9 });
    const other = await bookRoom({ setup, from: 10, hard: true });
    const { cards } = await board({ context });
    const card = cards.find((c) => c.id === order.id);
    expect(card?.flags).toEqual([
      expect.objectContaining({ kind: "HARD_CLASH", reference: other.order.reference }),
    ]);
    expect(cards.find((c) => c.id === other.order.id)?.flags).toEqual([]);
  });

  it("marks orders the caller only follows", async () => {
    const setup = await previewSetup();
    const { context } = setup;
    const order = await setup.newOrder();
    const eva = await memberUser({ context, name: "Eva Holm" });
    const input = { subjectType: "ORDER" as const, subjectId: order.id, userId: eva };
    unwrap({ result: await execute({ operation: followAssignment, input, context }) });
    const seen = await board({ context: as({ context, userId: eva }) });
    expect(seen.cards.find((c) => c.id === order.id)?.following).toBe(true);
    const mine = await board({ context });
    expect(mine.cards.every((c) => !c.following)).toBe(true);
  });

  it("reads the same cues for any orders, e.g. a page of the order table", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const order = await setup.newOrder();
    await addLine({ setup, orderId: order.id, itemId: room.id, from: 9 });
    const other = await bookRoom({ setup, from: 10, hard: true });
    const input = { orderIds: [order.id, other.order.id, "missing"] };
    const { cues } = unwrap({ result: await execute({ operation: pipelineCues, input, context }) });
    expect(cues).toHaveLength(2);
    expect(cues.find((cue) => cue.orderId === order.id)).toMatchObject({
      soft: true,
      following: false,
      flags: [expect.objectContaining({ kind: "HARD_CLASH", reference: other.order.reference })],
    });
    expect(cues.find((cue) => cue.orderId === other.order.id)).toMatchObject({ soft: false });
  });
});
