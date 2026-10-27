import { getEnv } from "@bibi/config";
import { routing } from "@bibi/i18n/routing";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { resolveHostAction } from "./server/host-routing";
import { syncActiveOrganization } from "./server/sync-active-organization";

type CreateProxyInput = { intl: ReturnType<typeof createMiddleware> };
type HostRoutingInput = { request: NextRequest };

/** The public site and the app live on different hosts (ADR 0073); null = no host rule applies. */
function routeByHost({ request }: HostRoutingInput): NextResponse | null {
  const { PUBLIC_URL, WEB_URL } = getEnv();
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;
  const action = resolveHostAction({
    host,
    pathname,
    search,
    publicUrl: PUBLIC_URL,
    webUrl: WEB_URL,
  });
  if (action.type === "redirect") return NextResponse.redirect(action.url, 308);
  if (action.type === "rewrite") return NextResponse.rewrite(new URL(action.pathname, request.url));
  return null;
}

/** Next calls the proxy with the request alone, so the handler is built here. */
function createProxy({ intl }: CreateProxyInput) {
  return async (request: NextRequest) => {
    const hostResponse = routeByHost({ request });
    if (hostResponse) return hostResponse;
    const response = intl(request);
    await syncActiveOrganization({ request, response });
    return response;
  };
}

/**
 * Host routing first (ADR 0073), then next-intl locale routing (`/` → `/sv`, `/en/...`), then the
 * active organization follows the slug in the URL (ADR 0062). Next 16 calls this file `proxy`; it runs on the Node.js runtime.
 */
export const proxy = createProxy({ intl: createMiddleware(routing) });

export const config = {
  // Everything except API routes, Next internals and files with an extension (incl. .well-known).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
