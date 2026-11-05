import { describe, expect, it } from "vitest";
import { parseOrderQuery } from "../src/features/order/list-query";

describe("parseOrderQuery", () => {
  it("splits qualifiers from free text", () => {
    expect(parseOrderQuery({ q: "assignee:me kickoff status:Lead" })).toEqual({
      text: "kickoff",
      filters: [
        { key: "assignee", values: ["me"], negated: false },
        { key: "status", values: ["Lead"], negated: false },
      ],
    });
  });

  it("reads negation, quotes and comma alternatives", () => {
    const { filters } = parseOrderQuery({ q: '-status:Lost,Cancelled customer:"Volvo Cars"' });
    expect(filters).toEqual([
      { key: "status", values: ["Lost", "Cancelled"], negated: true },
      { key: "customer", values: ["Volvo Cars"], negated: false },
    ]);
  });

  it("reads quoted alternatives after a comma", () => {
    const { filters } = parseOrderQuery({ q: 'customer:"Kvarnby Design AB","Volvo Cars"' });
    expect(filters[0]?.values).toEqual(["Kvarnby Design AB", "Volvo Cars"]);
  });

  it("keeps unknown qualifiers, empty values and quoted phrases as text", () => {
    expect(parseOrderQuery({ q: 'room:12 status: "Volvo Cars" 10:30' })).toEqual({
      text: "room:12 status: Volvo Cars 10:30",
      filters: [],
    });
  });

  it("is case-insensitive on the qualifier", () => {
    expect(parseOrderQuery({ q: "Assignee:me" }).filters[0]?.key).toBe("assignee");
  });

  it("returns nothing for an empty search", () => {
    expect(parseOrderQuery({ q: undefined })).toEqual({ text: "", filters: [] });
  });
});
