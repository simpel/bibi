import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "./get-auth";

/**
 * Route handlers for `app/api/auth/[...all]/route.ts`:
 * `export const { GET, POST } = authHandler;`. The auth instance is created on first request.
 */
export const authHandler = toNextJsHandler((request: Request) => getAuth().handler(request));
