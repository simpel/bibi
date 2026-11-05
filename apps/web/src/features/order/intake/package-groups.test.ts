import { describe, expect, it } from "vitest";
import { entryFixture } from "./entry-fixture";
import { cardNotes, groupPackages, type PackageOption } from "./package-groups";

const option = ({ id }: { id: string }): PackageOption => ({
  id,
  name: id,
  minGuests: null,
  maxGuests: null,
  lineNames: [],
  entityTypeId: "tt",
  fields: {},
});

describe("groupPackages", () => {
  it("puts each package in its preview's group, in the packages' order", () => {
    const groups = groupPackages({
      options: [option({ id: "a" }), option({ id: "b" }), option({ id: "c" }), option({ id: "d" })],
      entries: [
        entryFixture({ templateId: "c", group: "CLASHES" }),
        entryFixture({ templateId: "a" }),
        entryFixture({ templateId: "b", group: "OUTSIDE_RANGE" }),
      ],
    });
    expect(groups.AVAILABLE.map(({ option: { id } }) => id)).toEqual(["a"]);
    expect(groups.CLASHES.map(({ option: { id } }) => id)).toEqual(["c"]);
    expect(groups.OUTSIDE_RANGE.map(({ option: { id } }) => id)).toEqual(["b"]);
  });
});

describe("cardNotes", () => {
  it("says available when nothing stands in the way", () => {
    const notes = cardNotes({ entry: entryFixture({}), headcount: 10, availabilityHidden: false });
    expect(notes).toEqual([{ kind: "AVAILABLE", tone: "ok" }]);
  });

  it("counts clashes and warnings and adds the range notes", () => {
    const endsAt = new Date("2026-11-20T15:00:00.000Z");
    const entry = entryFixture({
      lineIssues: [["HARD_CLASH", "OUTSIDE_HOURS"], ["HARD_CLASH"]],
      issues: [
        { kind: "GUESTS_OUTSIDE_RANGE", maxGuests: 8 },
        { kind: "PAST_REQUESTED_END", endsAt },
      ],
    });
    expect(cardNotes({ entry, headcount: 10, availabilityHidden: false })).toEqual([
      { kind: "CLASHES", tone: "clash", count: 2 },
      { kind: "WARNINGS", tone: "warn", count: 1 },
      { kind: "GUESTS_OUTSIDE", tone: "warn", headcount: 10 },
      { kind: "PAST_END", tone: "warn", endsAt },
    ]);
  });

  it("says availability is hidden without item:read", () => {
    const notes = cardNotes({ entry: entryFixture({}), headcount: 1, availabilityHidden: true });
    expect(notes).toEqual([{ kind: "HIDDEN", tone: "muted" }]);
  });
});
