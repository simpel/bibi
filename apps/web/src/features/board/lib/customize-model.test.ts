import type { PipelineBoard, TicketStatusDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { customizeChips, customizePhases, moveInLayout, reorderLayout } from "./customize-model";

const status = ({ id, closed = false }: { id: string; closed?: boolean }) => ({
  id,
  title: id,
  color: "#64748b",
  requiresReason: false,
  closed,
});

const board = {
  boardId: "b",
  boardName: "Sales",
  columns: [
    {
      id: "open",
      title: "Open",
      color: "#f59e0b",
      closed: false,
      statuses: [status({ id: "lead" })],
    },
    {
      id: "won",
      title: "Won",
      color: "#22c55e",
      closed: false,
      statuses: [status({ id: "confirmed" }), status({ id: "locked" })],
    },
  ],
  cards: [{ statusId: "lead" }, { statusId: "lead" }, { statusId: "confirmed" }],
  unmappedCount: 0,
} as unknown as PipelineBoard;

const dto = ({ id }: { id: string }) => ({ id, name: id, color: "#000000" }) as TicketStatusDto;

describe("customize model", () => {
  it("lists the columns with their status ids", () => {
    expect(customizePhases({ board }).map((p) => [p.id, p.statusIds])).toEqual([
      ["open", ["lead"]],
      ["won", ["confirmed", "locked"]],
    ]);
  });

  it("counts tickets only for statuses on the board", () => {
    const statuses = ["lead", "confirmed", "locked", "spare"].map((id) => dto({ id }));
    const chips = customizeChips({ board, statuses });
    expect(chips.map((chip) => chip.count)).toEqual([2, 1, 0, undefined]);
  });

  it("moves a status between columns and off the board", () => {
    const phases = customizePhases({ board });
    const moved = moveInLayout({ phases, statusId: "lead", toPhaseId: "won" });
    expect(moved.map((p) => p.statusIds)).toEqual([[], ["confirmed", "locked", "lead"]]);
    const off = moveInLayout({ phases, statusId: "locked", toPhaseId: null });
    expect(off.map((p) => p.statusIds)).toEqual([["lead"], ["confirmed"]]);
  });

  it("reorders the columns", () => {
    const phases = customizePhases({ board });
    expect(reorderLayout({ phases, ids: ["won", "open"] }).map((p) => p.id)).toEqual([
      "won",
      "open",
    ]);
  });
});
