import { describe, expect, it } from "vitest";
import { draftFromTypes } from "../src/features/pipeline-setup/draft-from-templates";
import { localizeDraft, templateNameKey } from "../src/features/pipeline-setup/localize-draft";

const upper = ({ name }: { name: string }) => name.toUpperCase();

describe("localizeDraft", () => {
  it("renames statuses and states with every reference to them", () => {
    const draft = draftFromTypes({
      statuses: "default",
      types: [{ name: "Room", bookable: true }],
      existingTypes: [],
    });
    const localized = localizeDraft({ draft, statusName: upper, stateName: upper });
    const statuses = new Set(localized.statuses.map((status) => status.name));
    const states = new Set(localized.itemTypes.flatMap((type) => type.states.map((s) => s.name)));
    expect([...statuses]).toEqual(draft.statuses.map((status) => upper({ name: status.name })));
    expect(localized.cells.length).toBe(draft.cells.length);
    for (const cell of localized.cells) {
      expect(statuses.has(cell.orderStatus)).toBe(true);
      expect(states.has(cell.state)).toBe(true);
    }
    expect(localized.itemTypes[0]?.expiryState).toBe("RELEASED");
    expect(localized.itemTypes[0]?.name).toBe("Room");
  });

  it("keys a template name as lowercase words joined by dashes", () => {
    expect(templateNameKey({ name: "Final count locked" })).toBe("final-count-locked");
  });
});
