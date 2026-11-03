import type { NextRequest } from "next/server";
import { CURRENT_PATH_HEADER, orgRelativePath } from "@/features/billing/lib/return-to";
import { orgSlugFromPathname } from "@/lib/org-path";

export type SetCurrentPathHeaderInput = { request: NextRequest };

/**
 * Puts the path below `/:locale/:org` on the request (`x-bibi-path`), so the app layout can send
 * an unpaid organization to the payment page and back (ADR 0095 §5). next-intl forwards the
 * request's headers; a client-sent value is always replaced or removed.
 */
export function setCurrentPathHeader({ request }: SetCurrentPathHeaderInput): void {
  const { pathname, search } = request.nextUrl;
  const path = orgSlugFromPathname({ pathname }) ? orgRelativePath({ pathname, search }) : null;
  try {
    if (path) request.headers.set(CURRENT_PATH_HEADER, path);
    else request.headers.delete(CURRENT_PATH_HEADER);
  } catch {
    // Read-only headers: the gate then returns to `/` after paying, nothing else breaks.
  }
}
