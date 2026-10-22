import { routing } from "@bibi/i18n/routing";
import createMiddleware from "next-intl/middleware";

/** next-intl locale routing (`/` → `/sv`, `/en/...`). Next 16 calls this file `proxy`. */
export const proxy = createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals and files with an extension (incl. .well-known).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
