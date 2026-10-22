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
  const adapter = new PrismaPg({ connectionString: connectionString ?? getEnv().DATABASE_URL });
  return new PrismaClient({ adapter });
}
