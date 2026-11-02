import { describe, expect, it } from "vitest";
import { parseTicketQuery } from "../src/features/ticket/list-query";

describe("parseTicketQuery", () => {
  it("splits qualifiers from free text", () => {
    expect(parseTicketQuery({ q: "assignee:me kickoff status:Lead" })).toEqual({
      text: "kickoff",
      filters: [
        { key: "assignee", values: ["me"], negated: false },
        { key: "status", values: ["Lead"], negated: false },
      ],
    });
  });

  it("reads negation, quotes and comma alternatives", () => {
    const { filters } = parseTicketQuery({ q: '-status:Lost,Cancelled customer:"Volvo Cars"' });
    expect(filters).toEqual([
      { key: "status", values: ["Lost", "Cancelled"], negated: true },
      { key: "customer", values: ["Volvo Cars"], negated: false },
    ]);
  });

  it("reads quoted alternatives after a comma", () => {
    const { filters } = parseTicketQuery({ q: 'customer:"Kvarnby Design AB","Volvo Cars"' });
    expect(filters[0]?.values).toEqual(["Kvarnby Design AB", "Volvo Cars"]);
  });

  it("keeps unknown qualifiers, empty values and quoted phrases as text", () => {
    expect(parseTicketQuery({ q: 'room:12 status: "Volvo Cars" 10:30' })).toEqual({
      text: "room:12 status: Volvo Cars 10:30",
      filters: [],
    });
  });

  it("is case-insensitive on the qualifier", () => {
    expect(parseTicketQuery({ q: "Assignee:me" }).filters[0]?.key).toBe("assignee");
  });

  it("returns nothing for an empty search", () => {
    expect(parseTicketQuery({ q: undefined })).toEqual({ text: "", filters: [] });
  });
});
