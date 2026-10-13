import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

const rootEnvFile = new URL("../../.env", import.meta.url);
if (existsSync(rootEnvFile)) {
  loadEnvFile(rootEnvFile);
}

export default defineConfig({
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
