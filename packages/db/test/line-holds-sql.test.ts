import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

/** The trigger SQL files and the migrations that apply them (ADR 0053, 0054). */
const SQL_FILES = ["sync_line_occupancy.sql", "domain_history.sql", "sync_user_name.sql"] as const;

/** The latest migration that applies one trigger SQL file. */
function latestApplying({ file }: { file: string }) {
  const dir = join(root, "prisma/migrations");
  const applying = readdirSync(dir)
    .filter((name) => !name.endsWith(".toml"))
    .sort()
    .map((name) => readFileSync(join(dir, name, "migration.sql"), "utf8"))
    .filter((sql) => sql.includes(`BEGIN packages/db/sql/${file}`));
  return applying.at(-1) ?? "";
}

describe("trigger SQL (ADR 0053, 0054)", () => {
  it.each(SQL_FILES)("%s is applied verbatim by the latest migration that includes it", (file) => {
    const source = readFileSync(join(root, "sql", file), "utf8");
    const sql = latestApplying({ file });
    const start = sql.indexOf("\n", sql.indexOf(`BEGIN packages/db/sql/${file}`));
    const end = sql.indexOf(`-- END packages/db/sql/${file}`);
    expect(sql.slice(start + 1, end)).toBe(source);
  });
});

describe("line hold rows (ADR 0059)", () => {
  it("upsert on the Occupancy key the schema declares: one row per line, item and window", () => {
    const source = readFileSync(join(root, "sql", "sync_line_occupancy.sql"), "utf8");
    const schema = readFileSync(join(root, "prisma/schema/occupancy.prisma"), "utf8");
    expect(source).toContain('ON CONFLICT ("lineId", "itemId", "type")');
    expect(schema).toContain("@@unique([lineId, itemId, type])");
  });

  it("re-derives holds when the buffer minutes of a line, item or type change", () => {
    const source = readFileSync(join(root, "sql", "sync_line_occupancy.sql"), "utf8");
    for (const table of ["Line", "Item", "EntityType"]) {
      const trigger = source.slice(source.indexOf(`AFTER UPDATE ON "${table}"`));
      const when = trigger.slice(0, trigger.indexOf("EXECUTE FUNCTION"));
      expect(when).toContain('OLD."setupMinutes"');
      expect(when).toContain('OLD."teardownMinutes"');
    }
  });

  it("re-derives a line's holds when its allocations or their demands change (ADR 0059)", () => {
    const source = readFileSync(join(root, "sql", "sync_line_occupancy.sql"), "utf8");
    expect(source).toContain('AFTER INSERT ON "LineAllocation"');
    expect(source).toContain('AFTER UPDATE ON "LineAllocation"');
    expect(source).toContain('AFTER UPDATE ON "ItemDemand"');
  });
});
