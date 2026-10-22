import { createDb, type Db } from "./client";

const holder = globalThis as typeof globalThis & { __bibiDb?: Db };

/** Lazy process-wide singleton (survives Next.js dev hot reloads). */
export function getDb(): Db {
  holder.__bibiDb ??= createDb();
  return holder.__bibiDb;
}
