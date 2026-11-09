import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { ADMIN_GROUPS } from "./admin-items";
import {
  adminSearchIndex,
  adminSectionHref,
  type SearchableEntry,
  searchAdmin,
} from "./admin-search-index";
import { ADMIN_SECTIONS } from "./admin-sections";

type Overrides = Partial<SearchableEntry> & Pick<SearchableEntry, "id" | "label">;

const entry = ({ overrides }: { overrides: Overrides }): SearchableEntry => ({
  page: "general",
  href: ROUTES.adminGeneral,
  anchor: "x",
  pageLabel: "General",
  keywords: "",
  ...overrides,
});

const entries: SearchableEntry[] = [
  entry({
    overrides: { id: "timeZone", label: "Tidszon", keywords: "klocka", anchor: "time-zone" },
  }),
  entry({ overrides: { id: "providers", label: "Stripe", keywords: "kort betalning" } }),
  entry({ overrides: { id: "accounts", label: "Konton", keywords: "moms bas" } }),
];

describe("searchAdmin", () => {
  it("matches labels, keywords and pages, ignoring case and diacritics", () => {
    expect(searchAdmin({ entries, query: "TIDSZON" }).map((e) => e.id)).toEqual(["timeZone"]);
    expect(searchAdmin({ entries, query: "moms" }).map((e) => e.id)).toEqual(["accounts"]);
    expect(searchAdmin({ entries, query: "general" })).toHaveLength(3);
  });

  it("needs every word, and nothing for an empty query", () => {
    expect(searchAdmin({ entries, query: "kort klocka" })).toEqual([]);
    expect(searchAdmin({ entries, query: "  " })).toEqual([]);
  });

  it("links to the section on its page", () => {
    expect(adminSectionHref({ entry: entries[0] as SearchableEntry })).toBe(
      "/admin/general#time-zone",
    );
  });
});

describe("administration sections", () => {
  const index = adminSearchIndex({ groups: ADMIN_GROUPS });

  it("puts every section on exactly one page", () => {
    const ids = index.map((one) => one.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.keys(ADMIN_SECTIONS).sort());
  });

  it("renders every section somewhere in the web app (so each sub-link has its section)", () => {
    const featuresDir = join(import.meta.dirname, "..", "..", "features");
    const files = readdirSync(featuresDir, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => readFileSync(join(featuresDir, file), "utf8"));
    const missing = index.filter(
      (one) =>
        !files.some(
          (text) => text.includes(`section="${one.id}"`) || text.includes(`section: "${one.id}"`),
        ),
    );
    expect(missing.map((one) => one.id)).toEqual([]);
  });
});
