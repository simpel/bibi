import sv from "@bibi/i18n/messages/sv.json";
import { describe, expect, it } from "vitest";
import { defaultWorkOrderQuery, readWorkOrderListParams } from "./list-params";
import { buildWorkOrderQuery } from "./work-order-query";

describe("readWorkOrderListParams", () => {
  it("defaults to the first page of 25, newest first, without a search", () => {
    expect(readWorkOrderListParams({ params: {} })).toEqual({
      page: 1,
      pageSize: 25,
      q: undefined,
      sort: "created",
      direction: "desc",
    });
  });

  it("reads page, size, search, sort and direction", () => {
    const params = { page: "2", pageSize: "50", q: " is:sent ", sort: "version", dir: "asc" };
    expect(readWorkOrderListParams({ params })).toEqual({
      page: 2,
      pageSize: 50,
      q: "is:sent",
      sort: "version",
      direction: "asc",
    });
  });

  it("falls back on hand-edited values", () => {
    const params = { page: "0", pageSize: "7", sort: "nope" };
    expect(readWorkOrderListParams({ params })).toMatchObject({
      page: 1,
      pageSize: 25,
      sort: "created",
    });
  });
});

describe("defaultWorkOrderQuery", () => {
  it("is mine and current in the UI language", () => {
    const { vocabulary } = buildWorkOrderQuery({ messages: sv });
    expect(defaultWorkOrderQuery({ vocabulary })).toBe("inblandad:jag är:aktuell");
  });
});
