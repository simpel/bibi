import { describe, expect, it } from "vitest";
import { readNotificationPageParams } from "./list-params";

describe("readNotificationPageParams", () => {
  it("defaults both tables to page one, the newest first, all kinds", () => {
    const shared = { page: 1, pageSize: 25, q: undefined, kind: undefined, sort: "created" };
    expect(readNotificationPageParams({ params: {} })).toEqual({
      unread: { ...shared, read: "unread", direction: "desc" },
      read: { ...shared, read: "read", direction: "desc" },
    });
  });

  it("pages each table on its own and shares the filters and sort", () => {
    const params = { page: "3", readPage: "2", readPageSize: "50", kind: "ASSIGNED", sort: "kind" };
    const view = readNotificationPageParams({ params });
    expect(view.unread).toMatchObject({ page: 3, pageSize: 25, kind: "ASSIGNED", sort: "kind" });
    expect(view.read).toMatchObject({ page: 2, pageSize: 50, kind: "ASSIGNED", sort: "kind" });
  });

  it("falls back on unknown values, and on sorting by read state", () => {
    const bad = { page: "-1", pageSize: "7", kind: "NOPE", sort: "read", dir: "up" };
    expect(readNotificationPageParams({ params: bad }).unread).toMatchObject({
      page: 1,
      pageSize: 25,
      kind: undefined,
      sort: "created",
      direction: "desc",
    });
  });
});
