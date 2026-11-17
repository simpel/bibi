import { describe, expect, it } from "vitest";
import {
  archiveBoard,
  createBoard,
  createBoardPhase,
  type ExecuteContext,
  execute,
  getBoard,
  listBoards,
  pipelineBoard,
  shareBoard,
  updateBoard,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { memberUser, orderSetup } from "./order-helpers";

type AsInput = { of: ExecuteContext; userId: string; access?: "read" | "write" };

/** The member `userId` signed in to `of`'s organization. */
const as = ({ of, userId, access = "read" }: AsInput) =>
  testContext({ organizationId: of.organizationId, access, actor: { type: "user", userId } });

const ids = async ({ context }: { context: ExecuteContext }) => {
  const page = unwrap({ result: await execute({ operation: listBoards, input: {}, context }) });
  return page.items.map((board) => board.name);
};

async function setup() {
  const { context } = await orderSetup();
  const anna = as({ of: context, userId: await memberUser({ context, name: "Anna" }) });
  const bo = as({ of: context, userId: await memberUser({ context, name: "Bo" }) });
  const cia = as({ of: context, userId: await memberUser({ context, name: "Cia" }) });
  const input = { name: "Anna's week" };
  const view = unwrap({ result: await execute({ operation: createBoard, input, context: anna }) });
  return { context, anna, bo, cia, view };
}

describe("shared pipeline views (ADR 0111)", () => {
  it("keeps a new view private to its owner", async () => {
    const { anna, bo, view } = await setup();
    expect(await ids({ context: anna })).toEqual(["Pipeline", "Anna's week"]);
    expect(await ids({ context: bo })).toEqual(["Pipeline"]);
    const get = await execute({ operation: getBoard, input: { id: view.id }, context: bo });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const board = await execute({
      operation: pipelineBoard,
      input: { boardId: view.id },
      context: bo,
    });
    expect(errorCode({ result: board })).toBe("NOT_FOUND");
  });

  it("shares with specific members, who may edit but not reshare or archive", async () => {
    const { anna, bo, cia, view } = await setup();
    const userIds = [bo.actor.userId ?? "", anna.actor.userId ?? ""];
    const input = { id: view.id, organization: false, userIds };
    const shared = unwrap({
      result: await execute({ operation: shareBoard, input, context: anna }),
    });
    expect(shared.sharedWithUserIds).toEqual([bo.actor.userId]);
    expect(await ids({ context: bo })).toContain("Anna's week");
    expect(await ids({ context: cia })).not.toContain("Anna's week");
    const rename = { id: view.id, name: "Our week" };
    expect(
      errorCode({ result: await execute({ operation: updateBoard, input: rename, context: bo }) }),
    ).toBeNull();
    const phase = { boardId: view.id, name: "Bo's column" };
    expect(
      errorCode({
        result: await execute({ operation: createBoardPhase, input: phase, context: bo }),
      }),
    ).toBeNull();
    const reshare = { id: view.id, organization: true, userIds: [] };
    expect(
      errorCode({ result: await execute({ operation: shareBoard, input: reshare, context: bo }) }),
    ).toBe("FORBIDDEN");
    const archive = await execute({ operation: archiveBoard, input: { id: view.id }, context: bo });
    expect(errorCode({ result: archive })).toBe("FORBIDDEN");
  });

  it("shares with the whole organization and back", async () => {
    const { anna, cia, view } = await setup();
    const share = ({ organization }: { organization: boolean }) =>
      execute({ operation: shareBoard, input: { id: view.id, organization }, context: anna });
    unwrap({ result: await share({ organization: true }) });
    expect(await ids({ context: cia })).toContain("Anna's week");
    unwrap({ result: await share({ organization: false }) });
    expect(await ids({ context: cia })).toEqual(["Pipeline"]);
  });

  it("refuses non-members, the default view's sharing and lets managers archive shared views", async () => {
    const { context, anna, view } = await setup();
    const stranger = { id: view.id, organization: false, userIds: ["user_not_a_member"] };
    const refused = await execute({ operation: shareBoard, input: stranger, context: anna });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const [first] = unwrap({
      result: await execute({ operation: listBoards, input: {}, context }),
    }).items;
    const defaultShare = { id: first?.id ?? "", organization: false };
    const shareDefault = await execute({ operation: shareBoard, input: defaultShare, context });
    expect(errorCode({ result: shareDefault })).toBe("CONFLICT");
    unwrap({
      result: await execute({
        operation: shareBoard,
        input: { id: view.id, organization: true },
        context: anna,
      }),
    });
    const manager = as({ of: context, userId: "user_manager", access: "write" });
    const archived = await execute({
      operation: archiveBoard,
      input: { id: view.id },
      context: manager,
    });
    expect(errorCode({ result: archived })).toBeNull();
  });

  it("keeps names unique per owner, not per organization", async () => {
    const { bo } = await setup();
    const input = { name: "Anna's week" };
    expect(
      errorCode({ result: await execute({ operation: createBoard, input, context: bo }) }),
    ).toBeNull();
    expect(
      errorCode({ result: await execute({ operation: createBoard, input, context: bo }) }),
    ).toBe("CONFLICT");
    const taken = { name: "Pipeline" };
    expect(
      errorCode({ result: await execute({ operation: createBoard, input: taken, context: bo }) }),
    ).toBe("CONFLICT");
  });
});
