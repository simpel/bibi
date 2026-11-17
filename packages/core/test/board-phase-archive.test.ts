import { describe, expect, it } from "vitest";
import {
  archiveBoardPhase,
  createBoard,
  createBoardPhase,
  type ExecuteContext,
  execute,
  getBoard,
  listBoards,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser, orderSetup } from "./order-helpers";

const asMember = async ({ context }: { context: ExecuteContext }) =>
  testContext({
    organizationId: context.organizationId,
    access: "read",
    actor: { type: "user", userId: await memberUser({ context, name: "Anna" }) },
  });

describe("removing a column (ADR 0111)", () => {
  it("lets a member remove a column from their own view", async () => {
    const { context } = await orderSetup();
    const anna = await asMember({ context });
    const view = unwrap({
      result: await execute({ operation: createBoard, input: { name: "Mine" }, context: anna }),
    });
    expect(view.viewerCan).toEqual({ edit: true, manage: true });
    const input = { boardId: view.id, name: "Col" };
    const phase = unwrap({
      result: await execute({ operation: createBoardPhase, input, context: anna }),
    });
    const removed = await execute({
      operation: archiveBoardPhase,
      input: { id: phase.id },
      context: anna,
    });
    expect(errorCode({ result: removed })).toBeNull();
  });

  it("refuses a member removing a column from the default view", async () => {
    const { context } = await orderSetup();
    const anna = await asMember({ context });
    const page = unwrap({ result: await execute({ operation: listBoards, input: {}, context }) });
    const base = page.items.find((board) => board.isDefault);
    const phaseId = base?.phases[0]?.id ?? "";
    expect(phaseId).not.toBe("");
    const seen = unwrap({
      result: await execute({ operation: getBoard, input: { id: base?.id ?? "" }, context: anna }),
    });
    expect(seen.viewerCan).toEqual({ edit: false, manage: false });
    const removed = await execute({
      operation: archiveBoardPhase,
      input: { id: phaseId },
      context: anna,
    });
    expect(errorCode({ result: removed })).toBe("FORBIDDEN");
  });
});
