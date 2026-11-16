import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  type ExecuteContext,
  execute,
  followAssignment,
  generateRunSheet,
  type MyWorkTasksInput,
  sendRunSheet,
  viewMyTasks,
} from "../src/index";
import { AT_SETUP_DAY } from "./dashboard-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { bookRoom, previewSetup } from "./preview-helpers";
import { runSheetSetup } from "./run-sheet-helpers";
import { addLine } from "./status-grid-helpers";

const DAY_MS = 86_400_000;

type AsInput = { context: ExecuteContext; userId: string; at?: Date };
/** The same organization seen by `userId`, with the clock on the setup day unless `at`. */
const as = ({ context, userId, at = AT_SETUP_DAY }: AsInput) => ({
  ...testContext({ organizationId: context.organizationId, actor: { type: "user", userId } }),
  now: () => at,
});

type TasksInput = { context: ExecuteContext; input?: MyWorkTasksInput };
const tasksOf = async ({ context, input = {} }: TasksInput) =>
  unwrap({ result: await execute({ operation: viewMyTasks, input, context }) }).tasks;

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

describe("myWork.tasks (spec: home, Needs you)", () => {
  it("asks the assignee to send a run sheet that is late, until it is sent", async () => {
    const { context, anna, runSheet, order } = await setup();
    const me = as({ context, userId: anna });
    expect(await tasksOf({ context: me })).toContainEqual(
      expect.objectContaining({
        kind: "RUN_SHEET_UNSENT",
        group: "LATE",
        orderId: order.id,
        reference: order.reference,
        runSheetId: runSheet.id,
        runSheetName: "Kitchen order",
        key: `RUN_SHEET_UNSENT:${order.id}:${runSheet.id}`,
      }),
    );
    unwrap({
      result: await execute({ operation: sendRunSheet, input: { id: runSheet.id }, context }),
    });
    const after = await tasksOf({ context: me });
    expect(after?.map((task) => task.kind)).not.toContain("RUN_SHEET_UNSENT");
  });

  it("asks the responsibility's owner, and never someone who only follows the order", async () => {
    const { context, order, definition } = await setup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const { responsibilityId } = definition;
    unwrap({
      result: await assign({ context, orderId: order.id, assigneeId: erik, responsibilityId }),
    });
    expect(await tasksOf({ context: as({ context, userId: erik }) })).toEqual([
      expect.objectContaining({ kind: "RUN_SHEET_UNSENT" }),
    ]);
    const eva = await memberUser({ context, name: "Eva Holm" });
    const follow = { subjectType: "ORDER" as const, subjectId: order.id, userId: eva };
    unwrap({ result: await execute({ operation: followAssignment, input: follow, context }) });
    expect(await tasksOf({ context: as({ context, userId: eva }) })).toEqual([]);
  });

  it("puts a double booking on the soft-held order first, as Blocked", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    const order = await setup.newOrder();
    await addLine({ setup, orderId: order.id, itemId: room.id, from: 9 });
    const other = await bookRoom({ setup, from: 10, hard: true });
    const anna = await memberUser({ context, name: "Anna Berg" });
    unwrap({ result: await assign({ context, orderId: order.id, assigneeId: anna }) });
    const tasks = await tasksOf({ context: as({ context, userId: anna }) });
    expect(tasks?.[0]).toMatchObject({
      kind: "HARD_CLASH",
      group: "BLOCKED",
      orderId: order.id,
      otherReference: other.order.reference,
    });
  });

  it("asks to close an order whose lines have ended, and filters by kind", async () => {
    const { context, anna, order } = await setup();
    const later = as({ context, userId: anna, at: new Date(AT_SETUP_DAY.getTime() + 2 * DAY_MS) });
    const open = await tasksOf({ context: later, input: { kinds: ["NOT_CLOSED"] } });
    expect(open).toEqual([
      expect.objectContaining({ kind: "NOT_CLOSED", group: "LATE", orderId: order.id }),
    ]);
    const far = as({ context, userId: anna, at: new Date(AT_SETUP_DAY.getTime() + 40 * DAY_MS) });
    expect(await tasksOf({ context: far, input: { kinds: ["NOT_CLOSED"] } })).toEqual([]);
  });

  it("gives nothing to a member it does not concern, and refuses an API key", async () => {
    const { context } = await setup();
    const sara = await memberUser({ context, name: "Sara Lind" });
    expect(await tasksOf({ context: as({ context, userId: sara }) })).toEqual([]);
    const key = testContext({
      organizationId: context.organizationId,
      actor: { type: "apiKey", userId: null, apiKeyId: "key_1" },
    });
    const result = await execute({ operation: viewMyTasks, input: {}, context: key });
    expect(errorCode({ result })).not.toBeNull();
  });
});
