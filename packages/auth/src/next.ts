import { withRequestLogging } from "@okazi/logger";
import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "./get-auth";

/** Better Auth's `Request -> Response` with request logging (ADR 0014). Use for every auth route. */
export const handleAuthRequest = withRequestLogging({
  surface: "auth",
  handler: (request) => getAuth().handler(request),
});

/**
 * Route handlers for `app/api/auth/[...all]/route.ts`:
 * `export const { GET, POST } = authHandler;`. The auth instance is created on first request.
 */
export const authHandler = toNextJsHandler(handleAuthRequest);
