import { loadRootEnv } from "@okazi/config/load-root-env";
import { defineConfig, env } from "prisma/config";

loadRootEnv();

/** `prisma generate` must work without a database (e.g. Docker builds). */
function readDatabaseUrl(): string | undefined {
  try {
    return env("DATABASE_URL");
  } catch {
    return undefined;
  }
}

const url = readDatabaseUrl();

export default defineConfig({
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations" },
  ...(url ? { datasource: { url } } : {}),
});
