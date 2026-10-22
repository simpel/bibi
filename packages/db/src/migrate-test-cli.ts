import { spawnSync } from "node:child_process";
import { loadTestEnv } from "@bibi/config/load-test-env";

// `pnpm test:db` (and before every `pnpm test`): creates the test database if missing (Prisma's
// `migrate deploy` does that; the init migration enables pgvector) and applies all migrations,
// so suites never touch the dev database. The URL comes from `loadTestEnv()`.
loadTestEnv();
const result = spawnSync("prisma", ["migrate", "deploy"], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
