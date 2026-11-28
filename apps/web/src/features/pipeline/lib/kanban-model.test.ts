import type { PipelineBoard, PipelineCard, PipelineStatus, PipelineTaskCard } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { findDrop, kanbanTaskCards } from "./kanban-model";

const status = ({ id, tasks }: { id: string; tasks: boolean }): PipelineStatus => ({
  id,
  title: id,
  color: "#000000",
  closed: false,
  entry: false,
  tasks,
});

const order: PipelineCard = {
  kind: "order",
  id: "o1",
  columnId: "open",
  statusId: "lead",
  reference: 1,
  title: null,
  typeName: "Conference",
  customerId: "c1",
  startsAt: null,
  endsAt: null,
  quantity: null,
  statusChangedAt: new Date("2026-10-01T08:00:00Z"),
  assigneeId: null,
  following: false,
  flags: [],
  heldLines: 0,
  nextTask: null,
  bookedLines: 0,
  estimatedValueMinor: null,
  confirmedValueMinor: null,
};

const task: PipelineTaskCard = {
  kind: "task",
  id: "k1",
  columnId: "open",
  statusId: "lead",
  typeName: "Site visit",
  customerId: "c1",
  dueAt: null,
  overdue: false,
  assigneeId: "u1",
  allowedStatusIds: ["confirmed"],
};

const board: PipelineBoard = {
  boardId: "b1",
  boardName: null,
  columns: [
    { id: "open", title: "Open", closed: false, statuses: [status({ id: "lead", tasks: true })] },
    {
      id: "won",
      title: "Won",
      closed: false,
      statuses: [status({ id: "confirmed", tasks: true }), status({ id: "locked", tasks: false })],
    },
  ],
  cards: [order],
  taskCards: [task],
  currency: "SEK",
  unmappedCount: 0,
} as PipelineBoard;

const transitions = { lead: ["confirmed", "locked"] };

describe("task cards on the board (ADR 0121)", () => {
  it("names a task card by its type, customer and assignee", () => {
    const [card] = kanbanTaskCards({
      board,
      customerNames: { c1: "Nordkust AB" },
      memberNames: { u1: "Sara Berg" },
    });
    expect(card).toMatchObject({
      title: "Site visit",
      customerName: "Nordkust AB",
      assigneeName: "Sara Berg",
    });
  });

  it("hides the names without customer:read or without a customer or assignee", () => {
    const [hidden] = kanbanTaskCards({ board, customerNames: {} });
    expect(hidden).toMatchObject({ customerName: null, assigneeName: null });
    const bare = { ...board, taskCards: [{ ...task, customerId: null, assigneeId: null }] };
    const [none] = kanbanTaskCards({ board: bare, customerNames: { c1: "Nordkust AB" } });
    expect(none).toMatchObject({ customerName: null, assigneeName: null });
  });

  it("resolves a task drop with the server's allowed statuses, not the order transitions", () => {
    const move = { cardId: "k1", fromColumnId: "open", toColumnId: "won" };
    const found = findDrop({ board, move, transitions });
    expect(found?.subject.kind).toBe("task");
    expect(found?.targets.map((s) => s.id)).toEqual(["confirmed"]);
  });

  it("resolves an order drop with the order transitions", () => {
    const move = { cardId: "o1", fromColumnId: "open", toColumnId: "won" };
    const found = findDrop({ board, move, transitions });
    expect(found?.subject.kind).toBe("order");
    expect(found?.targets.map((s) => s.id)).toEqual(["confirmed", "locked"]);
  });

  it("finds nothing for an unknown card or column", () => {
    expect(
      findDrop({
        board,
        move: { cardId: "x", fromColumnId: "open", toColumnId: "won" },
        transitions,
      }),
    ).toBeNull();
    expect(
      findDrop({
        board,
        move: { cardId: "k1", fromColumnId: "open", toColumnId: "nope" },
        transitions,
      }),
    ).toBeNull();
  });
});
