// Entry for the Better Auth CLI (`pnpm --filter @okazi/auth auth:generate`). Not used at runtime.
import { createDb } from "@okazi/db";
import { createAuth } from "./auth";

export const auth = createAuth({ db: createDb(), withoutDatabase: true });
