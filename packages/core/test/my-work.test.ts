import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  type ExecuteContext,
  execute,
  followAssignment,
  generateRunSheet,
  sendRunSheet,
  viewMyWork,
} from "../src/index";
import { AT_SETUP_DAY } from "./dashboard-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { bookRoom, previewSetup } from "./preview-helpers";
import { runSheetSetup } from "./run-sheet-helpers";
import { addLine } from "./status-grid-helpers";

const DAY = { from: "2037-11-01", to: "2037-11-01" };

/** The same organization seen by `userId`, with the clock on the setup day. */
const as = ({ context, userId }: { context: ExecuteContext; userId: string }) => ({
  ...testContext({ organizationId: context.organizationId, actor: { type: "user", userId } }),
  now: () => AT_SETUP_DAY,
});

type ViewInput = { from: string; to: string };
const view = ({ context, input = DAY }: { context: ExecuteContext; input?: ViewInput }) =>
  execute({ operation: viewMyWork, input, context });

type Assign = {
  context: ExecuteContext;
  orderId: string;
  assigneeId: string;
  responsibilityId?: string;
};
const assign = ({ context, orderId, assigneeId, responsibilityId }: Assign) =>
  execute({
    operation: assignAssignment,
    input: { subjectType: "ORDER", subjectId: orderId, assigneeId, responsibilityId },
    context,
  });

/** The run sheet setup with its Kitchen order generated and Anna as the order's main assignee. */
async function setup() {
  const base = await runSheetSetup();
  const { context, order, definition } = base;
  const input = { orderId: order.id, runSheetDefinitionId: definition.id };
  const runSheet = unwrap({
    result: await execute({ operation: generateRunSheet, input, context }),
  });
  const anna = await memberUser({ context, name: "Anna Berg" });
  unwrap({ result: await assign({ context, orderId: order.id, assigneeId: anna }) });
  return { ...base, runSheet, anna };
}

describe("myWork.view (spec: home)", () => {
  it("gives the order's assignee a card for the day, with places, hold and the run sheet to send", async () => {
    const { context, anna, runSheet, order } = await setup();
    const work = unwrap({ result: await view({ context: as({ context, userId: anna }) }) });
    expect(work.now).toEqual(AT_SETUP_DAY);
    expect(work.cards).toEqual([
      expect.objectContaining({
        key: `${order.id}:2037-11-01`,
        orderId: order.id,
        day: "2037-11-01",
        dayIndex: 1,
        dayCount: 1,
        places: ["Älvsalen"],
        reasons: ["ASSIGNEE"],
        flags: [
          expect.objectContaining({
            kind: "RUN_SHEET",
            runSheetId: runSheet.id,
            runSheetName: "Kitchen order",
            runSheetStatus: "DRAFT",
          }),
        ],
      }),
    ]);
  });

  it("shows nothing to a member it does not concern, and the card once they own a responsibility", async () => {
    const { context, order, definition } = await setup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const before = unwrap({ result: await view({ context: as({ context, userId: erik }) }) });
    expect(before.cards).toEqual([]);
    const { responsibilityId } = definition;
    unwrap({
      result: await assign({ context, orderId: order.id, assigneeId: erik, responsibilityId }),
    });
    const after = unwrap({ result: await view({ context: as({ context, userId: erik }) }) });
    expect(after.cards).toEqual([
      expect.objectContaining({
        reasons: ["RESPONSIBILITY"],
        flags: [expect.objectContaining({ kind: "RUN_SHEET" })],
      }),
    ]);
  });

  it("asks a member who follows the run sheet's responsibility to send it", async () => {
    const { context, order, definition } = await setup();
    const sara = await memberUser({ context, name: "Sara Berg" });
    const { responsibilityId } = definition;
    const input = {
      subjectType: "ORDER" as const,
      subjectId: order.id,
      responsibilityId,
      userId: sara,
    };
    unwrap({ result: await execute({ operation: followAssignment, input, context }) });
    const work = unwrap({ result: await view({ context: as({ context, userId: sara }) }) });
    expect(work.cards).toEqual([
      expect.objectContaining({
        reasons: ["RESPONSIBILITY_FOLLOWER"],
        flags: [expect.objectContaining({ kind: "RUN_SHEET" })],
      }),
    ]);
  });

  it("tells a follower without asking: the card has no flags", async () => {
    const { context, order } = await setup();
    const eva = await memberUser({ context, name: "Eva Holm" });
    const input = { subjectType: "ORDER" as const, subjectId: order.id, userId: eva };
    unwrap({ result: await execute({ operation: followAssignment, input, context }) });
    const work = unwrap({ result: await view({ context: as({ context, userId: eva }) }) });
    expect(work.cards).toEqual([expect.objectContaining({ reasons: ["FOLLOWER"], flags: [] })]);
  });

  it("drops the run sheet flag once sent, and leaves out other days", async () => {
    const { context, anna, runSheet } = await setup();
    unwrap({
      result: await execute({ operation: sendRunSheet, input: { id: runSheet.id }, context }),
    });
    const sent = unwrap({ result: await view({ context: as({ context, userId: anna }) }) });
    expect(sent.cards).toEqual([expect.objectContaining({ flags: [] })]);
    const next = { from: "2037-11-02", to: "2037-11-02" };
    const other = unwrap({
      result: await view({ context: as({ context, userId: anna }), input: next }),
    });
    expect(other.cards).toEqual([]);
  });

  it("flags a soft hold another order's hard hold overlaps", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const order = await setup.newOrder();
    await addLine({ setup, orderId: order.id, itemId: room.id, from: 9 });
    const other = await bookRoom({ setup, from: 10, hard: true });
    const anna = await memberUser({ context, name: "Anna Berg" });
    unwrap({ result: await assign({ context, orderId: order.id, assigneeId: anna }) });
    const work = unwrap({ result: await view({ context: as({ context, userId: anna }) }) });
    expect(work.cards).toEqual([
      expect.objectContaining({
        orderId: order.id,
        hold: "SOFT",
        flags: [expect.objectContaining({ kind: "HARD_CLASH", reference: other.order.reference })],
      }),
    ]);
  });

  it("points to the next day with a card after the period, and to none after the last", async () => {
    const { context, anna } = await setup();
    const me = as({ context, userId: anna });
    const before = { from: "2037-10-20", to: "2037-10-25" };
    const early = unwrap({ result: await view({ context: me, input: before }) });
    expect(early).toMatchObject({ cards: [], next: "2037-11-01" });
    const day = unwrap({ result: await view({ context: me }) });
    expect(day.next).toBeNull();
  });

  it("refuses a period longer than 14 days and an API key", async () => {
    const { context, anna } = await setup();
    const long = { from: "2037-11-01", to: "2037-11-15" };
    expect(
      errorCode({ result: await view({ context: as({ context, userId: anna }), input: long }) }),
    ).toBe("VALIDATION");
    const key = testContext({
      organizationId: context.organizationId,
      actor: { type: "apiKey", userId: null, apiKeyId: "key_1" },
    });
    expect(errorCode({ result: await view({ context: key }) })).not.toBeNull();
  });
});
