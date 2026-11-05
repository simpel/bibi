import { describe, expect, it } from "vitest";
import { buildTableQuery, filterTableRows, type TableQualifier } from "./table-filter-query";

type SampleRow = { id: string; name: string; type: string; status: string; city: string };

const QUALIFIERS: TableQualifier<SampleRow>[] = [
  { key: "type", label: "Type", options: ["Conference", "Workshop"], pick: (r) => r.type },
  { key: "status", label: "Status", options: ["Active", "Archived"], pick: (r) => r.status },
  { key: "city", label: "City", options: ["Göteborg", "Stockholm"], pick: (r) => r.city },
];

const ROWS: SampleRow[] = [
  { id: "1", name: "Alpha Hall", type: "Conference", status: "Active", city: "Göteborg" },
  { id: "2", name: "Beta Studio", type: "Workshop", status: "Archived", city: "Stockholm" },
];

describe("buildTableQuery", () => {
  it("builds vocabulary, texts and distinct catalog options", () => {
    const built = buildTableQuery({ qualifiers: QUALIFIERS });
    expect(built.vocabulary.qualifiers).toEqual(["type", "status", "city"]);
    expect(built.catalog.type).toEqual(["Conference", "Workshop"]);
    expect(built.texts.labels.status).toBe("Status");
  });
});

describe("filterTableRows", () => {
  it("filters by qualifier and free text", () => {
    const matched = filterTableRows({
      rows: ROWS,
      q: "type:Conference alpha",
      qualifiers: QUALIFIERS,
      getSearchText: (r) => `${r.name} ${r.type} ${r.city}`,
    });
    expect(matched.map((r) => r.id)).toEqual(["1"]);
  });

  it("supports negated qualifiers", () => {
    const matched = filterTableRows({
      rows: ROWS,
      q: "-status:Archived",
      qualifiers: QUALIFIERS,
      getSearchText: (r) => `${r.name} ${r.type} ${r.city}`,
    });
    expect(matched.map((r) => r.id)).toEqual(["1"]);
  });
});
