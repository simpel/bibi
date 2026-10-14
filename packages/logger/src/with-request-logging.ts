import { elapsedMs } from "./elapsed";
import { runWithLogContext } from "./log-context";
import { REQUEST_ID_HEADER, requestIdFrom } from "./request-id";
import { getLogger } from "./root-logger";
import type { Surface } from "./types";

export type RequestHandler = (request: Request) => Promise<Response>;

export type WithRequestLoggingInput = { surface: Surface; handler: RequestHandler };

type TagInput = { response: Response; requestId: string };

/** Echoes the request id to the caller; copies the response if its headers are immutable. */
function tagResponse({ response, requestId }: TagInput): Response {
  try {
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  } catch {
    const copy = new Response(response.body, response);
    copy.headers.set(REQUEST_ID_HEADER, requestId);
    return copy;
  }
}

const levelFor = ({ status }: { status: number }) =>
  status >= 500 ? "error" : status >= 400 ? "warn" : "info";

type LogRequestInput = { request: Request; requestId: string; handler: RequestHandler };

async function logRequest({ request, requestId, handler }: LogRequestInput): Promise<Response> {
  const since = performance.now();
  // Path only: query strings may carry tokens.
  const fields = { method: request.method, path: new URL(request.url).pathname };
  try {
    const response = await handler(request);
    const { status } = response;
    // For streams this is time to first byte (headers), not the end of the stream.
    getLogger()[levelFor({ status })]({
      event: "http.request",
      ...fields,
      status,
      durationMs: elapsedMs({ since }),
    });
    return tagResponse({ response, requestId });
  } catch (error) {
    const durationMs = elapsedMs({ since });
    getLogger().error({ event: "http.unhandledError", ...fields, durationMs, err: error });
    throw error;
  }
}

/**
 * Every HTTP entry point is wrapped in this (ADR 0014): opens the request log context
 * (`requestId`, `surface`), logs one `http.request` line per request and returns `x-request-id`.
 */
export function withRequestLogging({ surface, handler }: WithRequestLoggingInput): RequestHandler {
  return (request) => {
    const requestId = requestIdFrom({ headers: request.headers });
    return runWithLogContext({
      context: { requestId, surface },
      fn: () => logRequest({ request, requestId, handler }),
    });
  };
}
