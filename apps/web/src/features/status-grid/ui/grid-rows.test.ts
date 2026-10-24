import type { StatusGridCellDto, TicketStatusDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toGridRows } from "./grid-rows";

const ticketStatus = ({ id }: { id: string }) => ({ id }) as TicketStatusDto;
type CellInput = { statusId: string; entityTypeId: string; stateId: string };
const cell = ({ statusId, entityTypeId, stateId }: CellInput) =>
  ({ statusId, entityTypeId, stateId }) as StatusGridCellDto;

describe("toGridRows", () => {
  it("fills set cells and leaves the others null", () => {
    const rows = toGridRows({
      statuses: [ticketStatus({ id: "p1" }), ticketStatus({ id: "p2" })],
      typeIds: ["room", "food"],
      cells: [cell({ statusId: "p1", entityTypeId: "room", stateId: "booked" })],
    });
    expect(rows[0]?.cells).toEqual({ room: "booked", food: null });
    expect(rows[1]?.cells).toEqual({ room: null, food: null });
  });
});
