import { getDb } from "@bibi/db";
import { type Auth, createAuth } from "./auth";

const holder = globalThis as typeof globalThis & { __bibiAuth?: Auth };

/** Lazy process-wide Better Auth singleton (survives Next.js dev hot reloads). */
export function getAuth(): Auth {
  holder.__bibiAuth ??= createAuth({ db: getDb() });
  return holder.__bibiAuth;
}
