import { describe, expect, it } from "vitest";
import { filterEntries } from "./filter-entries";
import type { ReferenceEntry } from "./types";

type EntryInput = { id: string; group: string; summary: string };

const entry = ({ id, group, summary }: EntryInput): ReferenceEntry => ({
  id,
  toolName: `${group}_${id}`,
  group,
  operation: `${group}.${id}`,
  summary,
  permission: `${group}:read`,
  readOnly: true,
  approval: false,
  input: {},
  output: {},
});

const ENTRIES = [
  entry({ id: "list", group: "venue", summary: "List venues" }),
  entry({ id: "get", group: "venue", summary: "Get one venue" }),
  entry({ id: "list", group: "booking", summary: "List bookings" }),
];

describe("filterEntries", () => {
  it("groups everything in order when the query is empty", () => {
    const groups = filterEntries({ entries: ENTRIES, query: "" });
    expect(groups.map((group) => [group.group, group.entries.length])).toEqual([
      ["venue", 2],
      ["booking", 1],
    ]);
  });

  it("matches case-insensitively and drops empty groups", () => {
    const groups = filterEntries({ entries: ENTRIES, query: "BOOKING" });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.group).toBe("booking");
  });
});
