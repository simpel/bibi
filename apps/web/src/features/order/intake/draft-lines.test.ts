import { describe, expect, it } from "vitest";
import { completion, replacesLines } from "./complete-step";
import { linesFromEntry, removeLine, shiftLines, upsertLine } from "./draft-lines";
import { at, draftFixture, entryWith, previewLineFixture } from "./line-fixture";
import { newReview } from "./review-state";

const counter = () => {
  let next = 0;
  return () => `k${++next}`;
};

const entry = entryWith({
  lines: [
    previewLineFixture({ from: 9, to: 11, name: "Room", quantity: 1 }),
    previewLineFixture({ from: 11, to: 14, name: "Lunch", itemId: "food" }),
  ],
});
const period = { startsAt: at({ hour: 9 }), endsAt: at({ hour: 12 }) };
const pkg = { kind: "PACKAGE", templateId: "t1", name: "Day", answers: {} } as const;

describe("draft lines", () => {
  it("takes a package's planned lines with fresh keys", () => {
    const lines = linesFromEntry({ entry, newKey: counter() });
    expect(lines.map(({ key, name, quantity }) => [key, name, quantity])).toEqual([
      ["k1", "Room", 1],
      ["k2", "Lunch", null],
    ]);
    expect(lines[1]?.endsAt).toBe(at({ hour: 14 }).toISOString());
  });

  it("shortens lines past the requested end when that was the answer", () => {
    const lines = linesFromEntry({ entry, newKey: counter(), shortenTo: at({ hour: 12 }) });
    expect(lines.map(({ endsAt }) => endsAt)).toEqual([
      at({ hour: 11 }).toISOString(),
      at({ hour: 12 }).toISOString(),
    ]);
  });

  it("moves timed lines by a delta and leaves untimed ones", () => {
    const lines = [draftFixture({ from: 9, to: 10 }), draftFixture({ key: "u" })];
    const moved = shiftLines({ lines, deltaMs: 2 * 3_600_000 });
    expect(moved[0]?.startsAt).toBe(at({ hour: 11 }).toISOString());
    expect(moved[1]?.startsAt).toBeNull();
  });

  it("edits a line in place, adds a new one at the end and removes by key", () => {
    const lines = [draftFixture({ key: "a" }), draftFixture({ key: "b" })];
    const edited = upsertLine({ lines, line: draftFixture({ key: "a", name: "Hall" }) });
    expect(edited.map(({ name }) => name)).toEqual(["Hall", "Room"]);
    expect(upsertLine({ lines, line: draftFixture({ key: "c" }) })).toHaveLength(3);
    expect(removeLine({ lines, key: "a" }).map(({ key }) => key)).toEqual(["b"]);
  });

  it("removes one add-on by its row key and moves add-ons with their own time (ADR 0088)", () => {
    const addOn = { itemId: "p", name: "Projector", quantity: null, unitPriceMinor: null };
    const own = {
      ...addOn,
      key: "x",
      startsAt: at({ hour: 9 }).toISOString(),
      endsAt: at({ hour: 10 }).toISOString(),
    };
    const follows = { ...addOn, key: "y", startsAt: null, endsAt: null };
    const lines = [draftFixture({ key: "a", from: 9, to: 12, addOns: [own, follows] })];
    expect(removeLine({ lines, key: "a:x" })[0]?.addOns.map(({ key }) => key)).toEqual(["y"]);
    const [moved] = shiftLines({ lines, deltaMs: 3_600_000 });
    expect(moved?.addOns.map(({ startsAt }) => startsAt)).toEqual([
      at({ hour: 10 }).toISOString(),
      null,
    ]);
  });
});

describe("completing step 3", () => {
  const review = newReview({
    lines: [draftFixture({ key: "a" })],
    plannedStart: null,
    pickKey: "t1",
  });

  it("asks before replacing only when lines exist and the pick changed", () => {
    expect(replacesLines({ review: null, pick: pkg })).toBe(0);
    expect(replacesLines({ review, pick: pkg })).toBe(0);
    expect(replacesLines({ review, pick: { ...pkg, templateId: "t2" } })).toBe(1);
    expect(replacesLines({ review, pick: { kind: "ONE_OFF" } })).toBe(1);
  });

  it("starts with the package's lines, none for a custom booking", () => {
    const first = completion({ review: null, pick: pkg, period, entry, newKey: counter() });
    expect(first.lines).toHaveLength(2);
    expect(first.plannedStart).toBe(period.startsAt.toISOString());
    const oneOff = { review: null, pick: { kind: "ONE_OFF" } as const, period, entry: null };
    expect(completion({ ...oneOff, newKey: counter() }).lines).toEqual([]);
  });

  it("keeps the lines for the same pick and replaces them for another", () => {
    const same = completion({ review, pick: pkg, period, entry, newKey: counter() });
    expect(same.lines).toBe(review.lines);
    const other = { ...pkg, templateId: "t2" };
    const replaced = completion({ review, pick: other, period, entry, newKey: counter() });
    expect(replaced.lines.map(({ key }) => key)).toEqual(["k1", "k2"]);
  });
});
