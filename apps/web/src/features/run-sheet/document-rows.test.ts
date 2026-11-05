import { createDateTimeFormat, type RunSheetRow } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { documentRows } from "./document-rows";

const dates = createDateTimeFormat({
  locale: "en",
  timeZone: "Europe/Stockholm",
  formats: { dateFormat: null, clockFormat: null },
});

type RowSpec = Partial<RunSheetRow> & Pick<RunSheetRow, "kind" | "key" | "label">;

const row = ({ kind, key, label, ...rest }: RowSpec) => ({
  kind,
  key,
  label,
  parentKey: null,
  itemName: null,
  quantity: null,
  startsAt: null,
  endsAt: null,
  values: {},
  ...rest,
});

const content = {
  rows: [
    row({ kind: "ORDER", key: "t", label: "Kick-off · #41", quantity: 20 }),
    row({
      kind: "ITEM",
      key: "l1",
      label: "Lunch",
      itemName: "Buffet",
      quantity: 20,
      values: { diet: ["Vegan", "Halal"] },
    }),
    row({ kind: "REQUIREMENT", key: "t:gluten", label: "Gluten", quantity: 3 }),
    row({ kind: "REQUIREMENT", key: "l1:nuts", label: "Nuts", quantity: 1, parentKey: "l1" }),
  ],
};

describe("documentRows", () => {
  it("splits a version into what to deliver and the counted needs", () => {
    const changes = [
      {
        key: "l1",
        kind: "ITEM" as const,
        change: "CHANGED" as const,
        label: "Lunch",
        changed: ["quantity"],
      },
      {
        key: "l2",
        kind: "ITEM" as const,
        change: "REMOVED" as const,
        label: "Coffee",
        changed: [],
      },
    ];
    const { tasks, needs } = documentRows({
      runSheet: { content, changes },
      dates,
      wholeOrder: "Whole order",
    });
    expect(tasks.map((task) => [task.name, task.change, task.fields.diet ?? null])).toEqual([
      ["Lunch", "CHANGED", "Vegan, Halal"],
      ["Coffee", "REMOVED", null],
    ]);
    expect(needs.map((need) => [need.need, need.quantity, need.appliesTo])).toEqual([
      ["Gluten", 3, "Whole order"],
      ["Nuts", 1, "Lunch"],
    ]);
  });
});
