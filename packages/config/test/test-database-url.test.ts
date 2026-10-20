import { describe, expect, it } from "vitest";
import { testDatabaseUrl } from "../src/test-database-url";

describe("testDatabaseUrl", () => {
  it("appends _test to the database name", () => {
    const url = testDatabaseUrl({
      databaseUrl: "postgresql://okazi:okazi@localhost:5432/okazi?schema=public",
      testDatabaseUrl: undefined,
    });
    expect(url).toBe("postgresql://okazi:okazi@localhost:5432/okazi_test?schema=public");
  });

  it("keeps a URL that already names a test database", () => {
    const databaseUrl = "postgresql://okazi:okazi@localhost:5432/okazi_wt_test";
    expect(testDatabaseUrl({ databaseUrl, testDatabaseUrl: undefined })).toBe(databaseUrl);
  });

  it("prefers TEST_DATABASE_URL", () => {
    const url = testDatabaseUrl({
      databaseUrl: "postgresql://okazi:okazi@localhost:5432/okazi",
      testDatabaseUrl: "postgresql://okazi:okazi@db:5432/other",
    });
    expect(url).toBe("postgresql://okazi:okazi@db:5432/other");
  });

  it("returns undefined without a database URL", () => {
    expect(testDatabaseUrl({ databaseUrl: undefined, testDatabaseUrl: undefined })).toBeUndefined();
  });
});
