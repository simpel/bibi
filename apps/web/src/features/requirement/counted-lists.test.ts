import type { VocabularyDto } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { countedLists } from "./counted-lists";

const list = ({ id, status = "ACTIVE" }: { id: string; status?: "ACTIVE" | "ARCHIVED" }) =>
  ({
    id,
    name: id,
    status,
    values: [{ id: `${id}-1`, name: "One", position: 0 }],
  }) as unknown as VocabularyDto;

const vocabularies = [list({ id: "allergens" }), list({ id: "severity" })];

describe("countedLists", () => {
  it("offers only the lists a run sheet counts", () => {
    const lists = countedLists({ vocabularies, runSheetListIds: ["allergens"] });
    expect(lists.map(({ id }) => id)).toEqual(["allergens"]);
  });

  it("offers every active list when no run sheet names one, or they are hidden", () => {
    const archived = [...vocabularies, list({ id: "old", status: "ARCHIVED" })];
    for (const runSheetListIds of [[], null]) {
      const lists = countedLists({ vocabularies: archived, runSheetListIds });
      expect(lists.map(({ id }) => id)).toEqual(["allergens", "severity"]);
    }
  });

  it("keeps each list's values by id and name", () => {
    const [allergens] = countedLists({ vocabularies, runSheetListIds: ["allergens"] });
    expect(allergens?.values).toEqual([{ id: "allergens-1", name: "One" }]);
  });
});
