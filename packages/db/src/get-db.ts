import { createDb, type Db } from "./client";

const holder = globalThis as typeof globalThis & { __okaziDb?: Db };

/** Lazy process-wide singleton (survives Next.js dev hot reloads). */
export function getDb(): Db {
  holder.__okaziDb ??= createDb();
  return holder.__okaziDb;
}
