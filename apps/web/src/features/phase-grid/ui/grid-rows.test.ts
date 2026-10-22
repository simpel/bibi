import type { PhaseGridCellDto, TicketPhaseDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toGridRows } from "./grid-rows";

const phase = ({ id }: { id: string }) => ({ id }) as TicketPhaseDto;
type CellInput = { phaseId: string; entityTypeId: string; stateId: string };
const cell = ({ phaseId, entityTypeId, stateId }: CellInput) =>
  ({ phaseId, entityTypeId, stateId }) as PhaseGridCellDto;

describe("toGridRows", () => {
  it("fills set cells and leaves the others null", () => {
    const rows = toGridRows({
      phases: [phase({ id: "p1" }), phase({ id: "p2" })],
      typeIds: ["room", "food"],
      cells: [cell({ phaseId: "p1", entityTypeId: "room", stateId: "booked" })],
    });
    expect(rows[0]?.cells).toEqual({ room: "booked", food: null });
    expect(rows[1]?.cells).toEqual({ room: null, food: null });
  });
});
