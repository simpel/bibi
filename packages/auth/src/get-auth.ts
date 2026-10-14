import { getDb } from "@okazi/db";
import { type Auth, createAuth } from "./auth";

const holder = globalThis as typeof globalThis & { __okaziAuth?: Auth };

/** Lazy process-wide Better Auth singleton (survives Next.js dev hot reloads). */
export function getAuth(): Auth {
  holder.__okaziAuth ??= createAuth({ db: getDb() });
  return holder.__okaziAuth;
}
