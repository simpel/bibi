import { describe, expect, it } from "vitest";
import { inboxFilterQuery, readInboxParams } from "./inbox-params";

describe("readInboxParams", () => {
  it("reads the cursor, read filter, channel and search", () => {
    const params = { cursor: "c1", read: "unread", channel: "EMAIL", q: " team " };
    expect(readInboxParams({ params })).toEqual({
      cursor: "c1",
      read: "unread",
      channel: "EMAIL",
      q: "team",
    });
  });

  it("drops unknown values and keeps only the filters on links", () => {
    const view = readInboxParams({ params: { read: "maybe", channel: "FAX", q: "  " } });
    expect(view).toEqual({ cursor: undefined, read: undefined, channel: undefined, q: undefined });
    expect(inboxFilterQuery({ params: { ...view, channel: "API", q: "x" } })).toEqual({
      channel: "API",
      q: "x",
    });
  });
});
