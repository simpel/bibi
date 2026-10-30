import { describe, expect, it } from "vitest";
import {
  archiveTicketStatus,
  createBoardPhase,
  createTicketStatus,
  type ExecuteContext,
  execute,
  listBoards,
  moveBoardPhaseStatus,
  pipelineBoard,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

async function defaultBoard({ context }: { context: ExecuteContext }) {
  const page = unwrap({ result: await execute({ operation: listBoards, input: {}, context }) });
  const board = page.items[0];
  if (!board) throw new Error("No default board");
  return board;
}

async function view({ context, boardId }: { context: ExecuteContext; boardId?: string }) {
  const input = boardId ? { boardId } : {};
  return unwrap({ result: await execute({ operation: pipelineBoard, input, context }) });
}

describe("pipeline.board on boards (ADR 0067)", () => {
  it("shows a phase with two statuses as one column and counts unmapped tickets", async () => {
    const { context, type, customer } = await ticketSetup();
    const ticket = await createTestTicket({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    const board = await defaultBoard({ context });
    const [lead, confirmed] = board.phases;
    if (!lead || !confirmed) throw new Error("Missing phases");
    const statusIds = [...lead.statusIds, ...confirmed.statusIds];
    const input = { boardId: board.id, name: "Open", color: "#22c55e", statusIds, position: 0 };
    const open = unwrap({ result: await execute({ operation: createBoardPhase, input, context }) });
    const grouped = await view({ context, boardId: board.id });
    expect(grouped.columns[0]?.statuses.map((s) => s.title)).toEqual(["Lead", "Confirmed"]);
    expect(grouped.cards[0]).toMatchObject({ columnId: open.id, statusId: ticket.statusId });
    const off = { boardId: board.id, statusId: ticket.statusId, phaseId: null };
    unwrap({ result: await execute({ operation: moveBoardPhaseStatus, input: off, context }) });
    const hidden = await view({ context });
    expect(hidden.cards).toHaveLength(0);
    expect(hidden.unmappedCount).toBe(1);
  });

  it("places a new status in a given phase, or on no column of the board", async () => {
    const { context } = await ticketSetup();
    const board = await defaultBoard({ context });
    const lead = board.phases[0];
    if (!lead) throw new Error("Missing phases");
    const inPhase = { name: "Site visit", color: "#0ea5e9", phaseId: lead.id };
    unwrap({ result: await execute({ operation: createTicketStatus, input: inPhase, context }) });
    const off = { name: "Quote sent", color: "#f59e0b" };
    unwrap({ result: await execute({ operation: createTicketStatus, input: off, context }) });
    const after = await view({ context });
    expect(after.columns.map((c) => c.title)).toEqual(["Lead", "Confirmed", "Completed", "Lost"]);
    expect(after.columns.flatMap((c) => c.statuses.map((s) => s.title))).not.toContain(
      "Quote sent",
    );
    expect(after.columns[0]?.statuses.map((s) => s.title)).toEqual(["Lead", "Site visit"]);
  });

  it("drops an archived status from the board and archives the phase it leaves empty", async () => {
    const { context } = await ticketSetup();
    const created = unwrap({
      result: await execute({
        operation: createTicketStatus,
        input: { name: "Spare", color: "#a855f7" },
        context,
      }),
    });
    unwrap({
      result: await execute({ operation: archiveTicketStatus, input: { id: created.id }, context }),
    });
    const board = await defaultBoard({ context });
    expect(board.phases.map((p) => p.name)).not.toContain("Spare");
  });
});
