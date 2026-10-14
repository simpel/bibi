import { type AnyOperation, appError, type ExecuteContext, type Result } from "@okazi/core";
import { compileRoutes } from "./http/compile-routes";
import { errorResponse } from "./http/error-response";
import { handleRoute } from "./http/handle-route";
import { matchRoute } from "./http/match-route";
import { buildOpenApiDocument } from "./openapi/build-document";
import { docsHtml } from "./openapi/docs-html";
import { listRestRoutes } from "./routes";

export type ResolveContextInput = { headers: Headers };
export type ResolveContext = (input: ResolveContextInput) => Promise<Result<ExecuteContext>>;

export type CreateRestHandlerInput = {
  operations: readonly AnyOperation[];
  resolveContext: ResolveContext;
  basePath?: string;
};

type RelativePathInput = { pathname: string; basePath: string };

function relativePath({ pathname, basePath }: RelativePathInput): string | undefined {
  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) return undefined;
  return pathname.slice(basePath.length).replace(/\/+$/, "") || "/";
}

/** Framework-agnostic `/api/v1` handler (Web Request → Response); mount it in a Next catch-all. */
export function createRestHandler({
  operations,
  resolveContext,
  basePath = "/api/v1",
}: CreateRestHandlerInput): (request: Request) => Promise<Response> {
  const compiled = compileRoutes({ routes: listRestRoutes(), operations });
  const document = buildOpenApiDocument({ compiled, basePath });
  const docs = docsHtml({ specUrl: `${basePath}/openapi.json` });

  return async (request) => {
    const url = new URL(request.url);
    const path = relativePath({ pathname: url.pathname, basePath });
    if (request.method === "GET" && path === "/openapi.json") return Response.json(document);
    if (request.method === "GET" && path === "/docs") {
      return new Response(docs, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    const match = path && matchRoute({ routes: compiled, method: request.method, pathname: path });
    if (!match) {
      return errorResponse({ error: appError({ code: "NOT_FOUND", message: "Route not found" }) });
    }
    const context = await resolveContext({ headers: request.headers });
    return handleRoute({ ...match, context, url, request });
  };
}
