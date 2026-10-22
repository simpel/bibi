// Entry for the Better Auth CLI (`pnpm --filter @bibi/auth auth:generate`). Not used at runtime.
import { createDb } from "@bibi/db";
import { createAuth } from "./auth";

export const auth = createAuth({ db: createDb(), withoutDatabase: true });
