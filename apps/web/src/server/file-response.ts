import "server-only";
import { getFile } from "@bibi/core";
import { withRequestLogging } from "@bibi/logger";
import { runOperation } from "./run-operation";

const PREFIX = "/api/files/";

const STATUS_BY_CODE: Record<string, number> = { UNAUTHENTICATED: 401, NOT_FOUND: 404 };

/**
 * `GET /api/files/<key>` (ADR 0063): a stored file the caller owns, through core `file.get`.
 * Private cache only; the session decides access, never the URL.
 */
export const fileResponse = withRequestLogging({
  surface: "web",
  handler: async (request) => {
    const key = decodeURIComponent(new URL(request.url).pathname.slice(PREFIX.length));
    const result = await runOperation({ operation: getFile, input: { key } });
    if (!result.ok) return new Response(null, { status: STATUS_BY_CODE[result.error.code] ?? 500 });
    const body = Buffer.from(result.value.base64, "base64");
    return new Response(body, {
      headers: {
        "content-type": result.value.contentType,
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  },
});
