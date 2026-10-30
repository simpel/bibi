import type { TicketStatusDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toStatusRows } from "./status-rows";

const ticketStatus = ({
  fields,
}: {
  fields: Partial<TicketStatusDto> & { id: string };
}): TicketStatusDto =>
  ({
    name: fields.id,
    color: "#000",
    entry: false,
    closes: false,
    invoiceable: false,
    event: null,
    transitionsTo: [],
    transitionGates: [],
    ...fields,
  }) as TicketStatusDto;

describe("toStatusRows", () => {
  it("lists each status's flags and resolves target names", () => {
    const rows = toStatusRows({
      statuses: [
        ticketStatus({
          fields: { id: "a", name: "Lead", entry: true, transitionsTo: ["b", "gone"] },
        }),
        ticketStatus({ fields: { id: "b", name: "Lost", closes: true, invoiceable: true } }),
      ],
    });
    expect(rows.map((row) => row.flags)).toEqual([["entry"], ["closes", "invoiceable"]]);
    expect(rows[0]?.targets).toEqual(["Lost", "gone"]);
  });
});
