import { describe, expect, it } from "vitest";
import {
  archiveBoard,
  archiveBoardPhase,
  createBoard,
  createBoardPhase,
  type ExecuteContext,
  execute,
  listBoards,
  moveBoardPhaseStatus,
  reorderBoardPhases,
  updateBoard,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { ticketSetup } from "./ticket-helpers";

async function defaultBoard({ context }: { context: ExecuteContext }) {
  const page = unwrap({ result: await execute({ operation: listBoards, input: {}, context }) });
  const board = page.items[0];
  if (!board) throw new Error("No default board");
  return board;
}

const names = ({ board }: { board: { phases: readonly { name: string }[] } }) =>
  board.phases.map((p) => p.name);

describe("boards and phases (ADR 0067)", () => {
  it("gives a provisioned organization one default board, one phase per status", async () => {
    const { context } = await ticketSetup();
    const board = await defaultBoard({ context });
    expect(names({ board })).toEqual(["Lead", "Confirmed", "Completed", "Lost"]);
    expect(board.phases.every((phase) => phase.statusIds.length === 1)).toBe(true);
  });

  it("groups statuses into a new phase and reorders phases", async () => {
    const { context } = await ticketSetup();
    const board = await defaultBoard({ context });
    const [lead, confirmed, completed, lost] = board.phases;
    if (!lead || !confirmed || !completed || !lost) throw new Error("Missing phases");
    const statusIds = [...completed.statusIds, ...lost.statusIds];
    const input = { boardId: board.id, name: "Closed", color: "#64748b", statusIds };
    const closed = unwrap({
      result: await execute({ operation: createBoardPhase, input, context }),
    });
    expect(closed.statusIds).toHaveLength(2);
    for (const id of [completed.id, lost.id]) {
      unwrap({ result: await execute({ operation: archiveBoardPhase, input: { id }, context }) });
    }
    const ids = [closed.id, confirmed.id, lead.id];
    const reordered = unwrap({
      result: await execute({
        operation: reorderBoardPhases,
        input: { boardId: board.id, ids },
        context,
      }),
    });
    expect(names({ board: reordered })).toEqual(["Closed", "Confirmed", "Lead"]);
    const partial = { boardId: board.id, ids: [lead.id] };
    const refused = await execute({ operation: reorderBoardPhases, input: partial, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("moves a status between phases and off the board, one phase per board", async () => {
    const { context } = await ticketSetup();
    const board = await defaultBoard({ context });
    const [lead, confirmed] = board.phases;
    const statusId = confirmed?.statusIds[0];
    if (!lead || !statusId) throw new Error("Missing phases");
    const input = { boardId: board.id, statusId, phaseId: lead.id };
    const moved = unwrap({
      result: await execute({ operation: moveBoardPhaseStatus, input, context }),
    });
    expect(moved.phases.find((p) => p.id === lead.id)?.statusIds).toContain(statusId);
    expect(moved.phases.filter((p) => p.statusIds.includes(statusId))).toHaveLength(1);
    const off = { ...input, phaseId: null };
    const removed = unwrap({
      result: await execute({ operation: moveBoardPhaseStatus, input: off, context }),
    });
    expect(removed.phases.some((p) => p.statusIds.includes(statusId))).toBe(false);
  });

  it("creates boards mirroring the statuses, keeps the last one, and checks the filter", async () => {
    const { context, type } = await ticketSetup();
    const first = await defaultBoard({ context });
    const input = { name: "Ops", entityTypeId: type.id };
    const ops = unwrap({ result: await execute({ operation: createBoard, input, context }) });
    expect(names({ board: ops })).toEqual(names({ board: first }));
    const bad = { id: ops.id, assigneeId: "user_not_a_member" };
    expect(
      errorCode({ result: await execute({ operation: updateBoard, input: bad, context }) }),
    ).toBe("VALIDATION");
    unwrap({ result: await execute({ operation: archiveBoard, input: { id: ops.id }, context }) });
    const last = await execute({ operation: archiveBoard, input: { id: first.id }, context });
    expect(errorCode({ result: last })).toBe("CONFLICT");
  });

  it("needs pipeline:write to change a board", async () => {
    const { context } = await ticketSetup();
    const manager = peer({ of: context, access: "write" });
    const result = await execute({
      operation: createBoard,
      input: { name: "Mine" },
      context: manager,
    });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});
