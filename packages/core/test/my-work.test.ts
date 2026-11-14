import { describe, expect, it } from "vitest";
import {
  assignAssignment,
  type ExecuteContext,
  execute,
  generateRunSheet,
  sendRunSheet,
  viewMyWork,
} from "../src/index";
import { AT_SETUP_DAY } from "./dashboard-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { runSheetSetup } from "./run-sheet-helpers";

const DAY = { from: "2037-11-01", to: "2037-11-01" };

/** The same organization seen by `userId`, with the clock on the setup day. */
const as = ({ context, userId }: { context: ExecuteContext; userId: string }) => ({
  ...testContext({ organizationId: context.organizationId, actor: { type: "user", userId } }),
  now: () => AT_SETUP_DAY,
});

const view = ({ context, input = DAY }: { context: ExecuteContext; input?: typeof DAY }) =>
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
  it("lists the run sheet's rows of the day for the order's assignee, with counts and why", async () => {
    const { context, anna, runSheet, held } = await setup();
    const work = unwrap({ result: await view({ context: as({ context, userId: anna }) }) });
    expect(work.rows).toEqual([
      expect.objectContaining({
        key: held.id,
        runSheetId: runSheet.id,
        runSheetName: "Kitchen order",
        status: "DRAFT",
        timed: true,
        reasons: ["ASSIGNEE"],
        needs: [expect.objectContaining({ quantity: 5, scope: "ORDER", blocking: false })],
      }),
    ]);
    expect(work.todo.runSheets).toEqual([
      expect.objectContaining({ runSheetId: runSheet.id, status: "DRAFT", reason: "ASSIGNEE" }),
    ]);
  });

  it("shows nothing to a member it does not concern, and a responsibility's rows once assigned", async () => {
    const { context, order, definition } = await setup();
    const erik = await memberUser({ context, name: "Erik Lund" });
    const before = unwrap({ result: await view({ context: as({ context, userId: erik }) }) });
    expect(before.rows).toEqual([]);
    const { responsibilityId } = definition;
    unwrap({
      result: await assign({ context, orderId: order.id, assigneeId: erik, responsibilityId }),
    });
    const after = unwrap({ result: await view({ context: as({ context, userId: erik }) }) });
    expect(after.rows).toEqual([expect.objectContaining({ reasons: ["RESPONSIBILITY"] })]);
    expect(after.todo.runSheets).toEqual([expect.objectContaining({ reason: "RESPONSIBILITY" })]);
  });

  it("drops the run sheet from to do once sent, and leaves out other days", async () => {
    const { context, anna, runSheet } = await setup();
    unwrap({
      result: await execute({ operation: sendRunSheet, input: { id: runSheet.id }, context }),
    });
    const sent = unwrap({ result: await view({ context: as({ context, userId: anna }) }) });
    expect(sent.todo.runSheets).toEqual([]);
    expect(sent.rows).toEqual([expect.objectContaining({ status: "PENDING" })]);
    const next = { from: "2037-11-02", to: "2037-11-02" };
    const other = unwrap({
      result: await view({ context: as({ context, userId: anna }), input: next }),
    });
    expect(other.rows).toEqual([]);
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
