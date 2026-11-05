import { getEnv } from "@bibi/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export type Db = PrismaClient;

export type CreateDbInput = {
  /** Defaults to `DATABASE_URL` from `getEnv()`. */
  connectionString?: string;
};

/** Creates an unscoped Prisma client. Prefer `scopedDb` for anything tenant-related. */
export function createDb({ connectionString }: CreateDbInput = {}): Db {
  const env = getEnv();
  // Pool size per process (ADR 0097); fewer queries per page, not a bigger pool, is the fix.
  const adapter = new PrismaPg({
    connectionString: connectionString ?? env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
  });
  return new PrismaClient({ adapter });
}
