import { describe, expect, it } from "vitest";
import { buildCrumbs } from "./breadcrumb-model";

describe("buildCrumbs", () => {
  it("is empty on the start page", () => {
    expect(buildCrumbs({ pathname: "/" })).toEqual([]);
  });

  it("builds one linked crumb per segment and labels ids as details", () => {
    expect(buildCrumbs({ pathname: "/admin/price-lists/abc" })).toEqual([
      { href: "/admin", labelKey: "admin" },
      { href: "/admin/price-lists", labelKey: "priceLists" },
      { href: "/admin/price-lists/abc", labelKey: "detail" },
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

  it("ends at the layouts crumb; the tab is part of that page (ADR 0099)", () => {
    expect(buildCrumbs({ pathname: "/items/abc/layouts/setup1" })).toEqual([
      { href: "/items", labelKey: "items" },
      { href: "/items/abc", labelKey: "detail" },
      { href: "/items/abc/layouts", labelKey: "layouts" },
    ]);
  });

  it("shows a calendar period as the calendar crumb alone", () => {
    expect(buildCrumbs({ pathname: "/calendar/2026-10-12/2026-10-18" })).toEqual([
      { href: "/calendar", labelKey: "calendar" },
    ]);
  });

  it("shows data with its tab for dashboards while omitting the period", () => {
    expect(buildCrumbs({ pathname: "/data" })).toEqual([{ href: "/data", labelKey: "dashboard" }]);
    expect(buildCrumbs({ pathname: "/data/forecast" })).toEqual([
      { href: "/data", labelKey: "dashboard" },
      { href: "/data/forecast", labelKey: "forecast" },
    ]);
    expect(buildCrumbs({ pathname: "/data/forecast/2026-11-04/2026-12-04" })).toEqual([
      { href: "/data", labelKey: "dashboard" },
      { href: "/data/forecast", labelKey: "forecast" },
    ]);
    expect(buildCrumbs({ pathname: "/data/financials/2026-10-01/2026-10-31" })).toEqual([
      { href: "/data", labelKey: "dashboard" },
      { href: "/data/financials", labelKey: "financials" },
    ]);
    expect(buildCrumbs({ pathname: "/data/workload/2026-10-01/2026-10-31" })).toEqual([
      { href: "/data", labelKey: "dashboard" },
      { href: "/data/workload", labelKey: "workload" },
    ]);
  });

  it("handles notifications correctly", () => {
    expect(buildCrumbs({ pathname: "/notifications" })).toEqual([
      { href: "/notifications", labelKey: "notifications" },
    ]);
  });

  it("points quotes crumbs to orders", () => {
    expect(buildCrumbs({ pathname: "/quotes/q-1" })).toEqual([
      { href: "/orders", labelKey: "orders" },
      { href: "/quotes/q-1", labelKey: "quotes" },
    ]);
  });

  it("skips non-existent detail crumbs for administration update pages", () => {
    expect(buildCrumbs({ pathname: "/admin/price-lists/abc/update" })).toEqual([
      { href: "/admin", labelKey: "admin" },
      { href: "/admin/price-lists", labelKey: "priceLists" },
      { href: "/admin/price-lists/abc/update", labelKey: "edit" },
    ]);
  });

  it("builds crumbs for public documentation pages without dead intermediate links", () => {
    expect(buildCrumbs({ pathname: "/support" })).toEqual([
      { href: "/support", labelKey: "support" },
    ]);
    expect(buildCrumbs({ pathname: "/developers/reference/mcp" })).toEqual([
      { href: "/developers", labelKey: "developers" },
      { href: "/developers/reference/mcp", labelKey: "detail" },
    ]);
  });

  it("names administration pages as the area's sidebar does", () => {
    expect(buildCrumbs({ pathname: "/admin/pipeline" })).toEqual([
      { href: "/admin", labelKey: "admin" },
      { href: "/admin/pipeline", labelKey: "orderFlow" },
    ]);
    expect(buildCrumbs({ pathname: "/admin/billing" })[1]?.labelKey).toBe("planBilling");
    expect(buildCrumbs({ pathname: "/pipeline" })[0]?.labelKey).toBe("pipeline");
  });

  it("builds crumbs for platform admin mothership pages", () => {
    expect(buildCrumbs({ pathname: "/mothership" })).toEqual([
      { href: "/mothership", labelKey: "platformAdmin" },
    ]);
    expect(buildCrumbs({ pathname: "/mothership/billing" })).toEqual([
      { href: "/mothership", labelKey: "platformAdmin" },
      { href: "/mothership/billing", labelKey: "billing" },
    ]);
  });
});
