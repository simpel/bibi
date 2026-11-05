import type { OrderStatusDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toStatusRows } from "./status-rows";

const orderStatus = ({
  fields,
}: {
  fields: Partial<OrderStatusDto> & { id: string };
}): OrderStatusDto =>
  ({
    name: fields.id,
    color: "#000",
    entry: false,
    closes: false,
    invoiceable: false,
    event: null,
    restrictsNext: false,
    transitionsTo: [],
    gatesInto: [],
    transitionGates: [],
    ...fields,
  }) as OrderStatusDto;

describe("toStatusRows", () => {
  it("lists each status's flags and resolves target names", () => {
    const rows = toStatusRows({
      statuses: [
        orderStatus({
          fields: {
            id: "a",
            name: "Lead",
            entry: true,
            restrictsNext: true,
            transitionsTo: ["b", "gone"],
          },
        }),
        orderStatus({ fields: { id: "b", name: "Lost", closes: true, invoiceable: true } }),
      ],
    });
    expect(rows.map((row) => row.flags)).toEqual([["entry"], ["closes", "invoiceable"]]);
    expect(rows[0]?.targets).toEqual(["Lost", "gone"]);
  });

  it("lists no targets for a status that moves freely", () => {
    const [row] = toStatusRows({
      statuses: [orderStatus({ fields: { id: "a", transitionsTo: ["b"] } })],
    });
    expect(row?.restrictsNext).toBe(false);
    expect(row?.targets).toEqual([]);
  });
});
