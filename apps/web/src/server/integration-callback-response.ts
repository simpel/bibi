import "server-only";
import { getEnv } from "@bibi/config";
import { completeIntegrationConnect } from "@bibi/core";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@bibi/i18n";
import { withRequestLogging } from "@bibi/logger";
import { ROUTES } from "@/lib/routes";
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

/** Runs the exchange for the signed-in member; the outcome is all the page learns. */
async function complete({ code, state }: { code: string; state: string }) {
  const result = await runOperation({
    operation: completeIntegrationConnect,
    input: { provider: "FORTNOX", code, state },
  });
  if (result.ok) return "connected" as const;
  if (result.error.code === "UNAUTHENTICATED") return "unauthenticated" as const;
  return result.error.code === "VALIDATION" ? ("expired" as const) : ("failed" as const);
}

/**
 * `GET /api/integrations/fortnox/callback` (ADR 0087): Fortnox sends the admin back here with
 * `code` and `state`. Never logs either; the redirect carries only the outcome.
 */
export const fortnoxCallbackResponse = withRequestLogging({
  surface: "web",
  handler: async (request) => {
    const params = new URL(request.url).searchParams;
    const session = await getSessionState();
    if (session.status === "anonymous") return redirectTo({ request, path: ROUTES.login });
    if (session.status !== "ready") return redirectTo({ request, path: "/" });
    const code = params.get("code");
    const state = params.get("state");
    const outcome: IntegrationOutcome | "unauthenticated" =
      params.has("error") || !code || !state ? "denied" : await complete({ code, state });
    if (outcome === "unauthenticated") return redirectTo({ request, path: ROUTES.login });
    const path = `/${session.organizationSlug}${ROUTES.adminIntegrations}?fortnox=${outcome}`;
    return redirectTo({ request, path });
  },
});
