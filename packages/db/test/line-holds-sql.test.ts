import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");
const source = readFileSync(join(root, "sql/sync_line_occupancy.sql"), "utf8");

/** The latest migration that applies the trigger SQL (ADR 0053). */
function latestApplying() {
  const dir = join(root, "prisma/migrations");
  const applying = readdirSync(dir)
    .filter((name) => !name.endsWith(".toml"))
    .sort()
    .map((name) => readFileSync(join(dir, name, "migration.sql"), "utf8"))
    .filter((sql) => sql.includes("BEGIN packages/db/sql/sync_line_occupancy.sql"));
  return applying.at(-1) ?? "";
}

describe("line holds SQL (ADR 0053)", () => {
  it("is applied verbatim by the latest migration that includes it", () => {
    const sql = latestApplying();
    const start = sql.indexOf("\n", sql.indexOf("BEGIN packages/db/sql/sync_line_occupancy.sql"));
    const end = sql.indexOf("-- END packages/db/sql/sync_line_occupancy.sql");
    expect(sql.slice(start + 1, end)).toBe(source);
  });
});
