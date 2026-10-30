import { describe, expect, it } from "vitest";
import { isSameTarget, resolveTarget, targetTitle, zoneDropId } from "./kanban-targets";

const columns = [
  { id: "open", title: "Open", zones: [{ id: "lead", title: "Lead" }] },
  {
    id: "won",
    title: "Won",
    zones: [
      { id: "confirmed", title: "Confirmed" },
      { id: "locked", title: "Final count locked" },
    ],
  },
  { id: "plain", title: "Plain" },
];

describe("kanban drop targets", () => {
  it("drops a single-zone column into its zone", () => {
    expect(resolveTarget({ id: "open", columns })).toEqual({ columnId: "open", zoneId: "lead" });
    expect(resolveTarget({ id: "plain", columns })).toEqual({ columnId: "plain" });
  });

  it("resolves a zone id to its column", () => {
    const id = zoneDropId({ zoneId: "locked" });
    expect(resolveTarget({ id, columns })).toEqual({ columnId: "won", zoneId: "locked" });
    expect(targetTitle({ id, columns })).toBe("Won › Final count locked");
    expect(resolveTarget({ id: "nope", columns })).toBeNull();
  });

  it("allows a move to another zone of the same column", () => {
    const card = { id: "c", columnId: "won", zoneId: "confirmed", title: "C" };
    expect(isSameTarget({ card, target: { columnId: "won", zoneId: "locked" } })).toBe(false);
    expect(isSameTarget({ card, target: { columnId: "won", zoneId: "confirmed" } })).toBe(true);
    expect(isSameTarget({ card, target: { columnId: "open", zoneId: "lead" } })).toBe(false);
  });
});
