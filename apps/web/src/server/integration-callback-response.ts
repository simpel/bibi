import "server-only";
import { getEnv } from "@bibi/config";
import { completeIntegrationConnect, type ProviderKey } from "@bibi/core";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@bibi/i18n";
import { withRequestLogging } from "@bibi/logger";
import { ROUTES } from "@/lib/routes";
import { providerKeyOf } from "./provider-key";
import { runOperation } from "./run-operation";
import { getSessionState } from "./session";

export type IntegrationOutcome = "connected" | "denied" | "expired" | "failed";

type RedirectInput = { request: Request; path: string };

/** The locale the visitor last used (next-intl's cookie), else the default. */
function localeOf({ request }: { request: Request }): Locale {
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)NEXT_LOCALE=([^;]+)/.exec(cookie);
  return match ? resolveLocale({ value: decodeURIComponent(match[1] ?? "") }) : DEFAULT_LOCALE;
}

/** On the app host (`WEB_URL`), not `request.url`: behind the proxy that is the container's address. */
function redirectTo({ request, path }: RedirectInput): Response {
  const url = new URL(`/${localeOf({ request })}${path}`, getEnv().WEB_URL);
  return Response.redirect(url, 302);
}

type CompleteInput = { provider: ProviderKey; code: string; state: string };

/** Runs the exchange for the signed-in member; the outcome is all the page learns. */
async function complete({ provider, code, state }: CompleteInput) {
  const result = await runOperation({
    operation: completeIntegrationConnect,
    input: { provider, code, state },
  });
  if (result.ok) return "connected" as const;
  if (result.error.code === "UNAUTHENTICATED") return "unauthenticated" as const;
  return result.error.code === "VALIDATION" ? ("expired" as const) : ("failed" as const);
}

type CallbackInput = { request: Request; provider: ProviderKey | null };

const handleCallback = async ({ request, provider }: CallbackInput): Promise<Response> => {
  const params = new URL(request.url).searchParams;
  const session = await getSessionState();
  if (session.status === "anonymous") return redirectTo({ request, path: ROUTES.login });
  if (session.status !== "ready") return redirectTo({ request, path: "/" });
  const integrations = `/${session.organizationSlug}${ROUTES.adminIntegrations}`;
  if (!provider) return redirectTo({ request, path: integrations });
  const code = params.get("code");
  const state = params.get("state");
  const outcome: IntegrationOutcome | "unauthenticated" =
    params.has("error") || !code || !state ? "denied" : await complete({ provider, code, state });
  if (outcome === "unauthenticated") return redirectTo({ request, path: ROUTES.login });
  const query = new URLSearchParams({ provider, outcome });
  return redirectTo({ request, path: `${integrations}?${query}` });
};

export type ProviderCallbackInput = { request: Request; segment: string };

/**
 * `GET /api/providers/<provider>/callback` (ADR 0087, 0100): an OAuth provider sends the admin
 * back here with `code` and `state`. Never logs either; the redirect to the integrations page
 * carries only `?provider=<KEY>&outcome=<outcome>`. An unknown provider lands there without one.
 */
export function providerCallbackResponse({ request, segment }: ProviderCallbackInput) {
  const provider = providerKeyOf({ segment });
  return withRequestLogging({
    surface: "web",
    handler: (logged) => handleCallback({ request: logged, provider }),
  })(request);
}
