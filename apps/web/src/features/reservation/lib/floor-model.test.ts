import { describe, expect, it } from "vitest";
import { type FloorBlock, tableStatus } from "./floor-model";

const reservations = [
  { id: "r1", state: "BOOKED", startsAtMs: 1000, endsAtMs: 2000, tableIds: ["t1"] },
  { id: "r2", state: "SEATED", startsAtMs: 1000, endsAtMs: 2000, tableIds: ["t2"] },
  { id: "r3", state: "NO_SHOW", startsAtMs: 1000, endsAtMs: 2000, tableIds: ["t3"] },
];
const block: FloorBlock = {
  id: "b1",
  tableId: "t4",
  label: "4",
  kind: "BLOCK",
  startsAtMs: 0,
  endsAtMs: 5000,
  period: "",
  note: null,
};

describe("tableStatus", () => {
  it("colours booked and seated tables and finds their reservation", () => {
    expect(tableStatus({ tableId: "t1", atMs: 1500, reservations, blocks: [] })).toMatchObject({
      tone: "selected",
      reservationId: "r1",
    });
    expect(tableStatus({ tableId: "t2", atMs: 1500, reservations, blocks: [] }).tone).toBe(
      "warning",
    );
  });
  it("leaves a table free outside the time or in a finished state", () => {
    expect(tableStatus({ tableId: "t1", atMs: 2000, reservations, blocks: [] }).tone).toBe(
      "default",
    );
    expect(tableStatus({ tableId: "t3", atMs: 1500, reservations, blocks: [] }).tone).toBe(
      "default",
    );
  });
  it("marks a blocked table", () => {
    const status = tableStatus({ tableId: "t4", atMs: 100, reservations, blocks: [block] });
    expect(status.tone).toBe("muted");
    expect(status.block?.id).toBe("b1");
  });
});
