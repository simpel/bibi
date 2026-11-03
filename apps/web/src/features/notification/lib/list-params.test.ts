import { describe, expect, it } from "vitest";
import { readNotificationListParams } from "./list-params";

describe("readNotificationListParams", () => {
  it("defaults to the newest first, all kinds, read and unread", () => {
    expect(readNotificationListParams({ params: {} })).toEqual({
      page: 1,
      pageSize: 25,
      q: undefined,
      kind: undefined,
      read: undefined,
      sort: "created",
      direction: "desc",
    });
  });

  it("reads the filters and falls back on unknown values", () => {
    const params = { page: "3", pageSize: "50", kind: "ASSIGNED", read: "unread", sort: "kind" };
    expect(readNotificationListParams({ params })).toMatchObject({
      page: 3,
      pageSize: 50,
      kind: "ASSIGNED",
      read: "unread",
      sort: "kind",
    });
    const bad = { page: "-1", pageSize: "7", kind: "NOPE", read: "maybe", sort: "x", dir: "up" };
    expect(readNotificationListParams({ params: bad })).toMatchObject({
      page: 1,
      pageSize: 25,
      kind: undefined,
      read: undefined,
      sort: "created",
      direction: "desc",
    });
  });
});
