import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { ADMIN_GROUPS } from "./admin-items";
import {
  ADMIN_SEARCH_INDEX,
  adminSearchHref,
  type SearchableEntry,
  searchAdmin,
} from "./admin-search-index";

const entry = ({
  overrides,
}: {
  overrides: Partial<SearchableEntry> & Pick<SearchableEntry, "id">;
}) => ({
  page: "general" as const,
  href: ROUTES.adminGeneral,
  label: "",
  pageLabel: "General",
  keywords: "",
  ...overrides,
});

const entries: SearchableEntry[] = [
  entry({
    overrides: { id: "timeZone", label: "Tidszon", keywords: "klocka", anchor: "time-zone" },
  }),
  entry({
    overrides: {
      id: "stripe",
      label: "Stripe",
      href: ROUTES.adminPayments,
      keywords: "kort betalning",
    },
  }),
  entry({
    overrides: {
      id: "accounts",
      label: "Konton",
      href: ROUTES.adminAccounting,
      keywords: "moms bas",
    },
  }),
];
const all = new Set(entries.map((one) => one.href));

describe("searchAdmin", () => {
  it("matches labels, keywords and pages, ignoring case and diacritics", () => {
    expect(searchAdmin({ entries, visibleHrefs: all, query: "TIDSZON" }).map((e) => e.id)).toEqual([
      "timeZone",
    ]);
    expect(searchAdmin({ entries, visibleHrefs: all, query: "moms" }).map((e) => e.id)).toEqual([
      "accounts",
    ]);
    expect(searchAdmin({ entries, visibleHrefs: all, query: "general" })).toHaveLength(3);
  });

  it("needs every word and hides pages the caller may not view", () => {
    expect(searchAdmin({ entries, visibleHrefs: all, query: "kort klocka" })).toEqual([]);
    const noPayments = new Set([ROUTES.adminGeneral, ROUTES.adminAccounting]);
    expect(searchAdmin({ entries, visibleHrefs: noPayments, query: "stripe" })).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    expect(searchAdmin({ entries, visibleHrefs: all, query: "  " })).toEqual([]);
  });
});

describe("ADMIN_SEARCH_INDEX", () => {
  it("only points at tabs in the administration sidebar", () => {
    const tabs = new Set(
      ADMIN_GROUPS.flatMap((g) => g.pages.flatMap((p) => p.tabs.map((t) => t.href))),
    );
    expect(ADMIN_SEARCH_INDEX.filter((one) => !tabs.has(one.href))).toEqual([]);
  });

  it("links to the section on the page", () => {
    expect(adminSearchHref({ entry: entries[0] as SearchableEntry })).toBe(
      "/admin/general#time-zone",
    );
  });
});

describe("ADMIN_SEARCH_INDEX anchors", () => {
  it("names an `id` that a component in the web app renders", () => {
    const srcDir = join(import.meta.dirname, "..", "..");
    const files = readdirSync(join(srcDir, "features"), { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => readFileSync(join(srcDir, "features", file), "utf8"));
    const missing = ADMIN_SEARCH_INDEX.filter(
      (one) => one.anchor && !files.some((text) => text.includes(`id="${one.anchor}"`)),
    );
    expect(missing).toEqual([]);
  });
});
