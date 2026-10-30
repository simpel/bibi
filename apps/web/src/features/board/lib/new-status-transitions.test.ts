import { describe, expect, it } from "vitest";
import { newStatusTransitions } from "./new-status-transitions";

const lead = { id: "lead", closes: false, transitionsTo: ["won", "lost"] };
const won = { id: "won", closes: false, transitionsTo: ["lost"] };
const lost = { id: "lost", closes: true, transitionsTo: [] };

describe("new status transitions", () => {
  it("lets every open status move in, and the status move to later and closing ones", () => {
    const visit = { id: "visit", closes: false, transitionsTo: [] };
    const updates = newStatusTransitions({
      created: visit,
      statuses: [lead, visit, won, lost],
      boardOrder: ["lead", "visit", "won", "lost"],
    });
    expect(updates).toEqual([
      { id: "lead", toStatusIds: ["won", "lost", "visit"] },
      { id: "won", toStatusIds: ["lost", "visit"] },
      { id: "visit", toStatusIds: ["won", "lost"] },
    ]);
  });

  it("gives a status off the board only the closing statuses as targets", () => {
    const spare = { id: "spare", closes: false, transitionsTo: [] };
    const updates = newStatusTransitions({
      created: spare,
      statuses: [lead, won, lost, spare],
      boardOrder: ["lead", "won", "lost"],
    });
    expect(updates.at(-1)).toEqual({ id: "spare", toStatusIds: ["lost"] });
  });

  it("gives a closing status no way out", () => {
    const cancelled = { id: "cancelled", closes: true, transitionsTo: [] };
    const updates = newStatusTransitions({
      created: cancelled,
      statuses: [lead, won, lost, cancelled],
      boardOrder: [],
    });
    expect(updates.map((update) => update.id)).toEqual(["lead", "won"]);
  });
});
