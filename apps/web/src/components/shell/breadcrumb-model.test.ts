import { describe, expect, it } from "vitest";
import { buildCrumbs } from "./breadcrumb-model";

describe("buildCrumbs", () => {
  it("is empty on the start page", () => {
    expect(buildCrumbs({ pathname: "/" })).toEqual([]);
  });

  it("builds one linked crumb per segment and labels ids as details", () => {
    expect(buildCrumbs({ pathname: "/settings/price-lists/abc" })).toEqual([
      { href: "/settings", labelKey: "settings" },
      { href: "/settings/price-lists", labelKey: "priceLists" },
      { href: "/settings/price-lists/abc", labelKey: "detail" },
    ]);
    expect(buildCrumbs({ pathname: "/admin/api-keys" })).toEqual([
      { href: "/admin", labelKey: "admin" },
      { href: "/admin/api-keys", labelKey: "apiKeys" },
    ]);
    expect(buildCrumbs({ pathname: "/admin/members/abc" })).toEqual([
      { href: "/admin", labelKey: "admin" },
      { href: "/admin/members", labelKey: "members" },
      { href: "/admin/members/abc", labelKey: "detail" },
    ]);
  });

  it("puts a /new/<thing> page under the thing's list", () => {
    expect(buildCrumbs({ pathname: "/new/item" })).toEqual([
      { href: "/items", labelKey: "items" },
      { href: "/new/item", labelKey: "new" },
    ]);
  });

  it("shows a calendar period as the calendar crumb alone", () => {
    expect(buildCrumbs({ pathname: "/calendar/2026-10-12/2026-10-18" })).toEqual([
      { href: "/calendar", labelKey: "calendar" },
    ]);
  });
});
