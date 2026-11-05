import { ReturnPathSchema } from "@bibi/core/schemas";
import { isScopedPath } from "@/lib/org-path";

/** The payment page (ADR 0095 §5), under the organization: `/:org/billing/pay`. */
export const PAY_PATH = "/billing/pay";
export const PAY_DONE_PATH = "/billing/pay/done";

/** A request header the proxy sets: the current path below `/:locale/:org`, with its query. */
export const CURRENT_PATH_HEADER = "x-bibi-path";

export type SafeReturnToInput = { value: string | string[] | null | undefined };

const isPayPath = ({ path }: { path: string }): boolean =>
  path === PAY_PATH || path.startsWith(`${PAY_PATH}/`) || path.startsWith(`${PAY_PATH}?`);

/**
 * A `returnTo` that is safe to open after paying: a path in the organization starting with one
 * `/`, never a full URL, a top-level page or the payment page itself. Anything else is `/`.
 */
export function safeReturnTo({ value }: SafeReturnToInput): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = ReturnPathSchema.safeParse(raw ?? undefined);
  if (!parsed.success) return "/";
  const path = parsed.data;
  if (!isScopedPath({ path }) || isPayPath({ path })) return "/";
  return path;
}

export type PayPathInput = { returnTo: string };

/** `/billing/pay?returnTo=…`: where the gate sends every page once the trial is over. */
export function payPath({ returnTo }: PayPathInput): string {
  return `${PAY_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

export type OrgRelativePathInput = { pathname: string; search: string };

/** `/sv/acme/orders/1` + `?tab=x` → `/orders/1?tab=x`; null outside `/:locale/:org`. */
export function orgRelativePath({ pathname, search }: OrgRelativePathInput): string | null {
  const [, locale, slug, ...rest] = pathname.split("/");
  if (!locale || !slug) return null;
  return `/${rest.join("/")}${search}`;
}
