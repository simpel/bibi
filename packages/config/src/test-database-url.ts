export type TestDatabaseUrlInput = {
  /** The checkout's own database (the dev database in the main checkout). */
  databaseUrl: string | undefined;
  /** An explicit test database; wins when set. */
  testDatabaseUrl: string | undefined;
};

const TEST_SUFFIX = "_test";

/**
 * The database tests run against: `TEST_DATABASE_URL` if set, else `DATABASE_URL` with `_test`
 * appended to the database name (`okazi` → `okazi_test`, a worktree's `okazi_<name>` →
 * `okazi_<name>_test`). Idempotent, so a URL that already names a `_test` database is kept.
 * Tests never write into the dev database.
 */
export function testDatabaseUrl({
  databaseUrl,
  testDatabaseUrl,
}: TestDatabaseUrlInput): string | undefined {
  if (testDatabaseUrl) return testDatabaseUrl;
  if (!databaseUrl) return undefined;
  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!name || name.endsWith(TEST_SUFFIX)) return databaseUrl;
  url.pathname = `/${encodeURIComponent(`${name}${TEST_SUFFIX}`)}`;
  return url.toString();
}
