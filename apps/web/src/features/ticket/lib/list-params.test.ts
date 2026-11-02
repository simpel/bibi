import { describe, expect, it } from "vitest";
import { readTicketListParams } from "./list-params";

describe("readTicketListParams", () => {
  it("defaults to the first page of 25, newest reference first", () => {
    expect(readTicketListParams({ params: {} })).toEqual({
      page: 1,
      pageSize: 25,
      q: undefined,
      sort: "reference",
      direction: "desc",
    });
  });

  it("reads page, size, search, sort and direction", () => {
    const params = { page: "3", pageSize: "100", q: " volvo ", sort: "when", dir: "asc" };
    expect(readTicketListParams({ params })).toMatchObject({
      page: 3,
      pageSize: 100,
      q: "volvo",
      sort: "when",
      direction: "asc",
    });
  });

  it("turns an old mine link into its qualifier", () => {
    expect(readTicketListParams({ params: { mine: "assigned" } }).q).toBe("assignee:me");
  });

  it("falls back to defaults for invalid values", () => {
    const params = { page: "-2", pageSize: "7", sort: "nope", dir: "up", q: "  " };
    expect(readTicketListParams({ params })).toMatchObject({
      page: 1,
      pageSize: 25,
      sort: "reference",
      direction: "desc",
      q: undefined,
    });
  });
});
