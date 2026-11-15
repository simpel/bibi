import { describe, expect, it } from "vitest";
import { SV_VOCABULARY } from "@/components/query-search/lib/test-vocabularies";
import {
  activeViewOf,
  addView,
  queryOf,
  readSavedViews,
  removeView,
  renameView,
  savedViewsKey,
} from "./saved-views";

const vocabulary = SV_VOCABULARY;
const ALL = ["all", "assigned", "following"] as const;

describe("readSavedViews", () => {
  it("gives the list's built-in views when nothing is stored or the value is broken", () => {
    expect(readSavedViews({ stored: null, defaults: ALL })).toHaveLength(3);
    expect(readSavedViews({ stored: "nope", defaults: ["all"] })).toEqual([{ default: "all" }]);
  });

  it("keeps the stored order and drops built-in views the list does not offer", () => {
    const stored = [{ id: "v1", name: "Leads", q: "status:Lead" }, { default: "following" }];
    expect(readSavedViews({ stored, defaults: ["all"] })).toEqual([stored[0]]);
    expect(readSavedViews({ stored: [], defaults: ALL })).toEqual([]);
  });
});

describe("activeViewOf", () => {
  const views = readSavedViews({
    stored: [
      { default: "all" },
      { default: "assigned" },
      { id: "v1", name: "L", q: "status:Lead" },
    ],
    defaults: ALL,
  });

  it("lights All for no search and a built-in view whichever language it was typed in", () => {
    expect(activeViewOf({ views, q: "", vocabulary })).toEqual({ default: "all" });
    expect(activeViewOf({ views, q: "assignee:me", vocabulary })).toEqual({ default: "assigned" });
    expect(
      activeViewOf({
        views,
        q: queryOf({ view: { default: "assigned" }, vocabulary }),
        vocabulary,
      }),
    ).toEqual({ default: "assigned" });
  });

  it("matches a saved search despite spacing and case, and nothing for another search", () => {
    expect(activeViewOf({ views, q: "  STATUS:lead ", vocabulary })).toMatchObject({ id: "v1" });
    expect(activeViewOf({ views, q: "status:Lost", vocabulary })).toBeUndefined();
  });
});

describe("editing views", () => {
  const views = [{ default: "all" as const }, { id: "v1", name: "Leads", q: "status:Lead" }];

  it("adds last, renames only saved views and removes by key", () => {
    expect(addView({ views, view: { id: "v2", name: "X", q: "x" } })).toHaveLength(3);
    expect(renameView({ views, key: "v1", name: "Hot" })[1]).toMatchObject({ name: "Hot" });
    expect(removeView({ views, key: "default:all" })).toEqual([views[1]]);
  });

  it("keys a list's views per organization", () => {
    expect(savedViewsKey({ organizationId: "OrgA", listId: "orders" })).toBe("views.orga.orders");
  });
});
