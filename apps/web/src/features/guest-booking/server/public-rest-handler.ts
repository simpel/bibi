import "server-only";
import { createPublicRestHandler } from "@bibi/api";
import { ensureOperations } from "@/server/operations";

type Handler = (request: Request) => Promise<Response>;

// One handler per process: its per-IP rate limiter keeps its counts across requests.
const holder = globalThis as typeof globalThis & { __bibiPublicRest?: Handler };

/** `/api/public/v1/*` (ADR 0119): the guest API, keyed by the booking page's slug or a token. */
export function publicRestHandler(): Handler {
  // Guest commands send their mails through the port `ensureOperations` installs.
  ensureOperations();
  holder.__bibiPublicRest ??= createPublicRestHandler();
  return holder.__bibiPublicRest;
}
