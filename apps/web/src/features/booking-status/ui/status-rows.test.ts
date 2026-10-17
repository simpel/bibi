import type { BookingStatusDto } from "@okazi/core/schemas";
import { describe, expect, it } from "vitest";
import { toStatusRows } from "./status-rows";

const status = ({
  fields,
}: {
  fields: Partial<BookingStatusDto> & { id: string };
}): BookingStatusDto =>
  ({
    name: fields.id,
    color: "#000",
    phase: "CONFIRMED",
    transitionsTo: [],
    ...fields,
  }) as BookingStatusDto;

describe("toStatusRows", () => {
  it("marks the first status of each phase as default and resolves target names", () => {
    const rows = toStatusRows({
      statuses: [
        status({
          fields: { id: "a", name: "Tentative", phase: "TENTATIVE", transitionsTo: ["b", "gone"] },
        }),
        status({ fields: { id: "b", name: "Booked", phase: "CONFIRMED" } }),
        status({ fields: { id: "c", name: "Done", phase: "CONFIRMED" } }),
      ],
    });
    expect(rows.map((row) => row.isDefault)).toEqual([true, true, false]);
    expect(rows[0]?.targets).toEqual(["Booked", "gone"]);
  });
});
