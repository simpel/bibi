import { describe, expect, it } from "vitest";
import { logQueryString, parseLogParams } from "./log-params";

describe("parseLogParams", () => {
  it("reads filters, the selected entry and defaults", () => {
    const { query, selected } = parseLogParams({
      params: { page: "3", level: "warn", q: "venue", log: "log_1", ignored: "x" },
    });
    expect(query).toMatchObject({ page: 3, pageSize: 50, level: "warn", q: "venue" });
    expect(selected).toBe("log_1");
  });

  it("falls back to defaults on invalid values", () => {
    const { query } = parseLogParams({ params: { page: "-2", level: "loud" } });
    expect(query).toMatchObject({ page: 1, pageSize: 50 });
    expect(query.level).toBeUndefined();
  });
});

describe("logQueryString", () => {
  it("resets to page 1 when a filter changes and drops empty values", () => {
    const current = new URLSearchParams("page=4&q=old&level=warn");
    expect(logQueryString({ current, patch: { q: "new", level: null } })).toBe("?q=new");
  });

  it("keeps the page when only the selected entry changes", () => {
    const current = new URLSearchParams("page=4");
    expect(logQueryString({ current, patch: { log: "log_9" } })).toBe("?page=4&log=log_9");
  });
});
