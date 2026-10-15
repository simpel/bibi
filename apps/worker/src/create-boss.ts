import { getEnv } from "@okazi/config";
import { getLogger } from "@okazi/logger";
import { PgBoss } from "pg-boss";

/** pg-boss on the app database; it migrates its own `pgboss` schema outside Prisma (ADR 0027). */
export function createBoss(): PgBoss {
  const boss = new PgBoss({ connectionString: getEnv().DATABASE_URL, schema: "pgboss" });
  boss.on("error", (error) => getLogger().error({ event: "worker.bossError", err: error }));
  return boss;
}
