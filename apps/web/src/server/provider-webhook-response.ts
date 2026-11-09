import "server-only";
import { createProviderWebhookHandler, type ProviderKey } from "@bibi/core";
import { withRequestLogging } from "@bibi/logger";
import { providerKeyOf } from "./provider-key";

type Handler = (request: Request) => Promise<Response>;

const handlers = new Map<ProviderKey, Handler>();

/** One logged handler per provider, made on first use. */
function handlerOf({ provider }: { provider: ProviderKey }): Handler {
  const known = handlers.get(provider);
  if (known) return known;
  const made = createProviderWebhookHandler({ provider });
  handlers.set(provider, made);
  return made;
}

const unknownProvider = withRequestLogging({
  surface: "webhook",
  handler: async () => Response.json({ error: "NOT_FOUND" }, { status: 404 }),
});

export type ProviderWebhookInput = { request: Request; segment: string };

/**
 * `POST /api/providers/<provider>/webhook` (ADR 0100): core's generic receiver verifies the
 * delivery with the provider's webhook port and applies its signals; no session. An unknown
 * provider is 404, one without a configured webhook 503.
 */
export function providerWebhookResponse({ request, segment }: ProviderWebhookInput) {
  const provider = providerKeyOf({ segment });
  return provider ? handlerOf({ provider })(request) : unknownProvider(request);
}
