import { describe, expect, it } from "vitest";
import { diffContent } from "../src/features/sheet/diff-content";
import type { SheetContent, SheetRow } from "../src/features/sheet/schema";

type Spec = { key: string } & Partial<SheetRow>;

/** A snapshot of ITEM rows with the given keys; the other attributes are overridden per spec. */
const content = ({ specs }: { specs: Spec[] }): SheetContent => ({
  rows: specs.map((spec) => ({
    kind: "ITEM",
    parentKey: null,
    label: spec.key,
    itemName: null,
    quantity: 1,
    startsAt: null,
    endsAt: null,
    values: {},
    ...spec,
  })),
});

const diff = ({ before, after }: { before: Spec[]; after: Spec[] }) =>
  diffContent({ before: content({ specs: before }), after: content({ specs: after }) });

describe("diffContent", () => {
  it("marks nothing when no version was sent before", () => {
    const after = content({ specs: [{ key: "a" }] });
    expect(diffContent({ before: null, after })).toEqual([]);
  });

  it.each([
    { name: "same rows", before: [{ key: "a" }], after: [{ key: "a" }], expected: [] },
    {
      name: "added row",
      before: [{ key: "a" }],
      after: [{ key: "a" }, { key: "b" }],
      expected: [{ key: "b", change: "ADDED", changed: [] }],
    },
    {
      name: "removed row",
      before: [{ key: "a" }, { key: "b" }],
      after: [{ key: "a" }],
      expected: [{ key: "b", change: "REMOVED", changed: [] }],
    },
    {
      name: "changed attribute and field values",
      before: [{ key: "a", values: { x: "1", y: "1" } }],
      after: [{ key: "a", quantity: 2, values: { x: "1", y: "2", z: "3" } }],
      expected: [{ key: "a", change: "CHANGED", changed: ["quantity", "y", "z"] }],
    },
  ])("$name", ({ before, after, expected }) => {
    const changes = diff({ before, after });
    expect(changes).toMatchObject(expected);
    expect(changes).toHaveLength(expected.length);
  });

  it("lists removed rows after the rows of the new content", () => {
    const changes = diff({
      before: [{ key: "a" }, { key: "b" }],
      after: [{ key: "c" }, { key: "a", label: "renamed" }],
    });
    expect(changes.map((change) => `${change.change}:${change.key}`)).toEqual([
      "ADDED:c",
      "CHANGED:a",
      "REMOVED:b",
    ]);
  });
});
