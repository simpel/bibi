import type { TicketPhaseDto } from "@okazi/core/schemas";
import { describe, expect, it } from "vitest";
import { toPhaseRows } from "./phase-rows";

const phase = ({ fields }: { fields: Partial<TicketPhaseDto> & { id: string } }): TicketPhaseDto =>
  ({
    name: fields.id,
    color: "#000",
    entry: false,
    terminal: false,
    requiresReason: false,
    requiresAssignee: false,
    invoiceable: false,
    transitionsTo: [],
    ...fields,
  }) as TicketPhaseDto;

describe("toPhaseRows", () => {
  it("lists each phase's flags and resolves target names", () => {
    const rows = toPhaseRows({
      phases: [
        phase({ fields: { id: "a", name: "Lead", entry: true, transitionsTo: ["b", "gone"] } }),
        phase({ fields: { id: "b", name: "Lost", terminal: true, requiresReason: true } }),
      ],
    });
    expect(rows.map((row) => row.flags)).toEqual([["entry"], ["terminal", "requiresReason"]]);
    expect(rows[0]?.targets).toEqual(["Lost", "gone"]);
  });
});
