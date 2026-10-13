import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

const rootEnvFile = new URL("../../.env", import.meta.url);
if (existsSync(rootEnvFile)) {
  loadEnvFile(rootEnvFile);
}

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
