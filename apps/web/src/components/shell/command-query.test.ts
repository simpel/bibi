import { describe, expect, it } from "vitest";
import { matchByName } from "@/features/search/command-hits";
import { commandListHref, parseCommandQuery } from "./command-query";

describe("parseCommandQuery", () => {
  it("reads an order reference from # or order:", () => {
    expect(parseCommandQuery({ query: "#34" })).toEqual({ kind: "reference", reference: 34 });
    expect(parseCommandQuery({ query: "order:34" })).toEqual({ kind: "reference", reference: 34 });
    expect(parseCommandQuery({ query: " Order:#34 " })).toEqual({
      kind: "reference",
      reference: 34,
    });
  });

  it("reads a list prefix with its text, in English or Swedish", () => {
    expect(parseCommandQuery({ query: "customer:acme" })).toEqual({
      kind: "scope",
      scope: "customer",
      text: "acme",
    });
    expect(parseCommandQuery({ query: "client:Volvo Cars" })).toEqual({
      kind: "scope",
      scope: "customer",
      text: "Volvo Cars",
    });
    expect(parseCommandQuery({ query: 'kund:"Volvo Cars"' })).toEqual({
      kind: "scope",
      scope: "customer",
      text: "Volvo Cars",
    });
    expect(parseCommandQuery({ query: "venue:hall" })).toEqual({
      kind: "scope",
      scope: "venue",
      text: "hall",
    });
    expect(parseCommandQuery({ query: "artikel:lunch" })).toEqual({
      kind: "scope",
      scope: "item",
      text: "lunch",
    });
    expect(parseCommandQuery({ query: "order:volvo" })).toEqual({
      kind: "scope",
      scope: "order",
      text: "volvo",
    });
  });

  it("sends order filters to the order list", () => {
    expect(parseCommandQuery({ query: "status:Lead" })).toEqual({
      kind: "orders",
      q: "status:Lead",
    });
    expect(parseCommandQuery({ query: "assignee:me is:open" })).toEqual({
      kind: "orders",
      q: "assignee:me is:open",
    });
    expect(parseCommandQuery({ query: "customer:volvo status:Lead" })).toEqual({
      kind: "orders",
      q: "customer:volvo status:Lead",
    });
  });

  it("leaves plain text, a bare prefix and unknown keys to the commands", () => {
    expect(parseCommandQuery({ query: "create order" })).toBeNull();
    expect(parseCommandQuery({ query: "customer:" })).toBeNull();
    expect(parseCommandQuery({ query: "#" })).toBeNull();
    expect(parseCommandQuery({ query: "#abc" })).toBeNull();
    expect(parseCommandQuery({ query: "what is 10:30" })).toBeNull();
  });
});

describe("commandListHref", () => {
  it("searches the list page for the text", () => {
    expect(commandListHref({ scope: "customer", q: "Volvo Cars" })).toBe("/customers?q=Volvo+Cars");
    expect(commandListHref({ scope: "order", q: "#34" })).toBe("/orders?q=%2334");
  });
});

describe("matchByName", () => {
  const rows = [
    { id: "a", name: "Älvsalen" },
    { id: "b", name: "Hall B" },
    { id: "c", name: "Small hall" },
  ];
  const href = ({ id }: { id: string }) => `/venues/${id}`;

  it("matches ignoring case and diacritics, and says when more matched than shown", () => {
    expect(matchByName({ rows, text: "alv", shown: 5, href }).hits.map((h) => h.id)).toEqual(["a"]);
    expect(matchByName({ rows, text: "HALL", shown: 1, href })).toEqual({
      hits: [{ id: "b", title: "Hall B", detail: null, href: "/venues/b" }],
      more: true,
    });
  });
});
