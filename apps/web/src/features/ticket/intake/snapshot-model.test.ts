import type { CalendarBlockDto } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { at, draftFixture, issueFixture, previewLineFixture } from "./line-fixture";
import { type SnapshotInput, snapshotOf } from "./snapshot-model";

const block = ({ ...input }: Partial<CalendarBlockDto>) =>
  ({
    ...{ id: "b1", itemId: "i1", startsAt: at({ hour: 8 }), endsAt: at({ hour: 10 }) },
    ...{ reference: 41, soft: false, allocated: false },
    ...input,
  }) as CalendarBlockDto;

const base: SnapshotInput = {
  lines: [
    draftFixture({ from: 9, to: 11 }),
    draftFixture({ key: "l2", name: "Sign", itemId: null }),
  ],
  planned: null,
  blocks: [block({}), block({ id: "b2", soft: true }), block({ id: "b3", itemId: "other" })],
  midnight: at({ hour: 0 }),
  itemNames: new Map([["i1", "Vinga"]]),
  blockLabel: ({ block: { reference } }) => `#${reference}`,
  programLabel: "This booking",
};

describe("snapshotOf", () => {
  it("shows 08–20 with the program and one row per item used", () => {
    const snapshot = snapshotOf(base);
    expect([snapshot.startMinute, snapshot.endMinute]).toEqual([480, 1200]);
    expect(snapshot.rows.map(({ label }) => label)).toEqual(["This booking", "Vinga"]);
    expect(snapshot.rows[1]?.blocks.map(({ id, tone }) => [id, tone])).toEqual([
      ["b1", "hard"],
      ["b2", "soft"],
      ["draft-l1", "draft"],
    ]);
  });

  it("widens to cover lines past midnight and marks clashing lines", () => {
    const lines = [draftFixture({ from: 22, to: 25 })];
    const planned = [previewLineFixture({ issues: [issueFixture({ kind: "HARD_CLASH" })] })];
    const snapshot = snapshotOf({ ...base, lines, planned });
    expect(snapshot.endMinute).toBe(25 * 60);
    expect(snapshot.rows[0]?.blocks[0]?.tone).toBe("clash");
  });

  it("lists short pools", () => {
    const short = issueFixture({ kind: "POOL_SHORT", needed: 12, free: 9 });
    const planned = [previewLineFixture({ issues: [short] }), previewLineFixture({})];
    expect(snapshotOf({ ...base, planned }).shortages).toEqual([
      { name: "Room", needed: 12, free: 9 },
    ]);
  });
});
