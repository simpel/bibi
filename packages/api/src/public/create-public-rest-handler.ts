import {
  appError,
  organizationOfPage,
  organizationOfToken,
  publicAvailability,
  publicBookingPage,
  publicCancelReservation,
  publicChangeReservation,
  publicCreateReservation,
  publicGetReservation,
  runGuest,
} from "@bibi/core";
import { withRequestLogging } from "@bibi/logger";
import { buildInput } from "../http/build-input";
import { compileRoutes } from "../http/compile-routes";
import { errorResponse } from "../http/error-response";
import { matchRoute } from "../http/match-route";
import { preflightResponse, withCors } from "./cors";
import { buildPublicOpenApiDocument } from "./openapi";
import { clientIp, createRateLimiter, type RateLimiter } from "./rate-limit";
import { PUBLIC_ROUTES } from "./routes";

export type CreatePublicRestHandlerInput = {
  basePath?: string;
  /** Injectable for tests; defaults to 60 reads and 10 writes per minute per IP. */
  rateLimiter?: RateLimiter;
};

const OPERATIONS = [
  publicBookingPage,
  publicAvailability,
  publicCreateReservation,
  publicGetReservation,
  publicChangeReservation,
  publicCancelReservation,
];

function relativePath({ pathname, basePath }: { pathname: string; basePath: string }) {
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return undefined;
  return pathname.slice(basePath.length).replace(/\/+$/, "") || "/";
}

/** Framework-agnostic `/api/public/v1` handler for guests (ADR 0119): no auth, CORS open, rate limited. */
export function createPublicRestHandler({
  basePath = "/api/public/v1",
  rateLimiter = createRateLimiter(),
}: CreatePublicRestHandlerInput = {}): (request: Request) => Promise<Response> {
  const compiled = compileRoutes({ routes: PUBLIC_ROUTES, operations: OPERATIONS });
  const document = buildPublicOpenApiDocument({ compiled, basePath });

  const inner = withRequestLogging({
    surface: "publicApi",
    handler: async (request) => {
      const url = new URL(request.url);
      const path = relativePath({ pathname: url.pathname, basePath });
      const kind = request.method === "GET" ? "read" : "write";
      const taken = rateLimiter.take({ ip: clientIp({ headers: request.headers }), kind });
      if (!taken.allowed) {
        const error = appError({ code: "UNAVAILABLE", message: "Too many requests" });
        const response = errorResponse({ error });
        return new Response(response.body, {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(taken.retryAfterSeconds),
          },
        });
      }
      if (request.method === "GET" && path === "/openapi.json") return Response.json(document);
      const match =
        path && matchRoute({ routes: compiled, method: request.method, pathname: path });
      if (!match)
        return errorResponse({
          error: appError({ code: "NOT_FOUND", message: "Route not found" }),
        });
      const input = await buildInput({ ...match, url, request });
      if (!input.ok) return errorResponse({ error: input.error });
      const { operation, route } = match.compiled;
      const value =
        operation.name === publicCreateReservation.name
          ? { ...input.value, source: "API" }
          : input.value;
      const slug = match.params.slug;
      const token = match.params.token;
      const organizationId = slug
        ? await organizationOfPage({ slug })
        : await organizationOfToken({ token: token ?? "" });
      const result = await runGuest({ organizationId, operation, input: value });
      if (!result.ok) return errorResponse({ error: result.error });
      return Response.json(result.value, { status: route.successStatus });
    },
  });

  return async (request) => {
    if (request.method === "OPTIONS") return preflightResponse();
    return withCors({ response: await inner(request) });
  };
}
