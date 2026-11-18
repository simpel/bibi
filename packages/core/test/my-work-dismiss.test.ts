import { describe, expect, it } from "vitest";
import { taskFingerprint } from "../src/features/my-work/dismissals";
import {
  assignAssignment,
  dismissMyTask,
  type ExecuteContext,
  execute,
  generateRunSheet,
  type MyWorkTask,
  viewMyTasks,
} from "../src/index";
import { AT_SETUP_DAY } from "./dashboard-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser } from "./order-helpers";
import { runSheetSetup } from "./run-sheet-helpers";

type AsInput = { context: ExecuteContext; userId: string };
/** The same organization seen by `userId`, with the clock on the setup day. */
const as = ({ context, userId }: AsInput) => ({
  ...testContext({ organizationId: context.organizationId, actor: { type: "user", userId } }),
  now: () => AT_SETUP_DAY,
});

const tasksOf = async ({ context }: { context: ExecuteContext }) =>
  unwrap({ result: await execute({ operation: viewMyTasks, input: {}, context }) }).tasks ?? [];

/** A Kitchen order to send, asked of Anna (the order's assignee) and Erik (its responsibility). */
async function setup() {
  const { context, order, definition } = await runSheetSetup();
  const input = { orderId: order.id, runSheetDefinitionId: definition.id };
  unwrap({ result: await execute({ operation: generateRunSheet, input, context }) });
  const anna = await memberUser({ context, name: "Anna Berg" });
  const erik = await memberUser({ context, name: "Erik Lund" });
  const subject = { subjectType: "ORDER" as const, subjectId: order.id };
  for (const assignee of [
    { assigneeId: anna },
    { assigneeId: erik, responsibilityId: definition.responsibilityId },
  ]) {
    const result = await execute({
      operation: assignAssignment,
      input: { ...subject, ...assignee },
      context,
    });
    unwrap({ result });
  }
  return { context, anna: as({ context, userId: anna }), erik: as({ context, userId: erik }) };
}

describe("myWork.dismissTask (ADR 0114)", () => {
  it("hides the task for the member who dismissed it, not for colleagues", async () => {
    const { anna, erik } = await setup();
    const [task] = (await tasksOf({ context: anna })).filter(
      (candidate) => candidate.kind === "RUN_SHEET_UNSENT",
    );
    if (!task) throw new Error("expected a run sheet task");
    const dismissed = await execute({
      operation: dismissMyTask,
      input: { key: task.key },
      context: anna,
    });
    expect(unwrap({ result: dismissed })).toEqual({ key: task.key });
    const keys = async ({ context }: { context: ExecuteContext }) =>
      (await tasksOf({ context })).map((candidate) => candidate.key);
    expect(await keys({ context: anna })).not.toContain(task.key);
    expect(await keys({ context: erik })).toContain(task.key);
  });

  it("refuses a key that is not one of the caller's tasks", async () => {
    const { anna } = await setup();
    const result = await execute({
      operation: dismissMyTask,
      input: { key: "UNCONFIRMED:missing" },
      context: anna,
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});

describe("taskFingerprint", () => {
  const task = {
    key: "UNCONFIRMED:o1",
    kind: "UNCONFIRMED",
    group: "SOON",
    dueAt: new Date("2027-01-10T08:00:00Z"),
    count: 2,
    amountMinor: null,
    otherReference: null,
    issueKind: null,
  } as MyWorkTask;

  it("stays the same when only the group moves with time", () => {
    const late = { ...task, group: "LATE" } as MyWorkTask;
    expect(taskFingerprint({ task: late })).toBe(taskFingerprint({ task }));
  });

  it("changes with the due time or the kind's own facts", () => {
    const moved = { ...task, dueAt: new Date("2027-01-11T08:00:00Z") };
    expect(taskFingerprint({ task: moved })).not.toBe(taskFingerprint({ task }));
    expect(taskFingerprint({ task: { ...task, count: 3 } })).not.toBe(taskFingerprint({ task }));
  });

  it("ignores the due time of unread messages, which is always now", () => {
    const messages = { ...task, kind: "UNREAD_MESSAGES" } as MyWorkTask;
    const later = { ...messages, dueAt: new Date() };
    expect(taskFingerprint({ task: later })).toBe(taskFingerprint({ task: messages }));
  });
});
