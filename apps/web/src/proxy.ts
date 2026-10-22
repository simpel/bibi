import { routing } from "@bibi/i18n/routing";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { syncActiveOrganization } from "./server/sync-active-organization";

type CreateProxyInput = { intl: ReturnType<typeof createMiddleware> };

/** Next calls the proxy with the request alone, so the handler is built here. */
function createProxy({ intl }: CreateProxyInput) {
  return async (request: NextRequest) => {
    const response = intl(request);
    await syncActiveOrganization({ request, response });
    return response;
  };
}

/**
 * next-intl locale routing (`/` → `/sv`, `/en/...`), then the active organization follows the
 * slug in the URL (ADR 0062). Next 16 calls this file `proxy`; it runs on the Node.js runtime.
 */
export const proxy = createProxy({ intl: createMiddleware(routing) });

export const config = {
  // Everything except API routes, Next internals and files with an extension (incl. .well-known).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
