import { describe, expect, it } from "vitest";
import { entryFixture } from "./entry-fixture";
import { comparePackage, rankPackages } from "./package-compare";
import type { PackageOption } from "./package-groups";

const option = ({ id }: { id: string }): PackageOption => ({
  id,
  name: id,
  minGuests: null,
  maxGuests: null,
  imageUrl: null,
  lines: [],
  itemIds: [],
  entityTypeId: "tt",
  fields: {},
});

const endsAt = new Date("2026-11-20T15:00:00.000Z");
const base = { headcount: 45, availabilityHidden: false };

describe("comparePackage", () => {
  it("counts no change for a package that fits as asked", () => {
    const card = { option: option({ id: "a" }), entry: entryFixture({ templateId: "a" }) };
    expect(comparePackage({ card, ...base })).toMatchObject({
      guestsFit: true,
      endsLater: null,
      rooms: { kind: "FREE" },
      changes: 0,
    });
  });

  it("counts guests, a later end and clashing rooms as one change each", () => {
    const entry = entryFixture({
      templateId: "b",
      lineIssues: [["HARD_CLASH", "OUTSIDE_HOURS"]],
      issues: [
        { kind: "GUESTS_OUTSIDE_RANGE", maxGuests: 30 },
        { kind: "PAST_REQUESTED_END", endsAt },
      ],
    });
    const compare = comparePackage({ card: { option: option({ id: "b" }), entry }, ...base });
    expect(compare).toMatchObject({
      guestsFit: false,
      endsLater: endsAt,
      rooms: { kind: "CLASHES", count: 1 },
      changes: 3,
    });
  });
});

describe("rankPackages", () => {
  it("puts the closest first and keeps the order of ties", () => {
    const far = entryFixture({
      templateId: "far",
      issues: [
        { kind: "GUESTS_OUTSIDE_RANGE", maxGuests: 6 },
        { kind: "PAST_REQUESTED_END", endsAt },
      ],
    });
    const near = entryFixture({
      templateId: "near",
      issues: [{ kind: "GUESTS_OUTSIDE_RANGE", maxGuests: 6 }],
    });
    const also = entryFixture({
      templateId: "also",
      issues: [{ kind: "GUESTS_OUTSIDE_RANGE", maxGuests: 6 }],
    });
    const cards = [
      { option: option({ id: "far" }), entry: far },
      { option: option({ id: "near" }), entry: near },
      { option: option({ id: "also" }), entry: also },
    ];
    const ranked = rankPackages({ cards, ...base }).map(({ card }) => card.option.id);
    expect(ranked).toEqual(["near", "also", "far"]);
  });
});
