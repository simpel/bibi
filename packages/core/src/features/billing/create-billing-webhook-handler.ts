import type { Db } from "@bibi/db";
import { withRequestLogging } from "@bibi/logger";
import { toHttpStatus } from "../../errors/to-http-status";
import { verifyStripeSignature } from "../payment/stripe-signature";
import { loadBillingWebhookSecret } from "./billing-config";
import { BillingEventSchema } from "./billing-event";
import { receiveBillingEvent } from "./receive-billing-event";

const reply = ({ status, body }: { status: number; body: Record<string, unknown> }) =>
  Response.json(body, { status });

function parseJson({ payload }: { payload: string }): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return undefined;
  }
}

type HandleInput = { request: Request; secret: string; db?: Db | undefined };

async function handle({ request, secret, db }: HandleInput): Promise<Response> {
  const payload = await request.text();
  const header = request.headers.get("stripe-signature");
  const verified = verifyStripeSignature({ payload, header, secret });
  if (!verified.ok) return reply({ status: 401, body: { error: verified.error.code } });
  const event = BillingEventSchema.safeParse(parseJson({ payload }));
  if (!event.success) return reply({ status: 400, body: { error: "VALIDATION" } });
  const received = await receiveBillingEvent({ event: event.data, ...(db ? { db } : {}) });
  if (!received.ok) {
    const status = toHttpStatus({ error: received.error });
    return reply({ status, body: { error: received.error.code } });
  }
  return reply({ status: 200, body: { status: received.value.status } });
}

export type CreateBillingWebhookHandlerInput = { secret?: string; db?: Db };

/**
 * `POST /api/webhooks/stripe-billing` (ADR 0091 §4, 0095 §8): Bibi's own subscription events,
 * signed with the secret stored in `BillingConfig` (503 until a superadmin set it).
 */
export function createBillingWebhookHandler({ secret, db }: CreateBillingWebhookHandlerInput = {}) {
  return withRequestLogging({
    surface: "webhook",
    handler: async (request) => {
      const stored = secret
        ? { ok: true as const, value: secret }
        : await loadBillingWebhookSecret();
      if (!stored.ok || !stored.value)
        return reply({ status: 503, body: { error: "UNAVAILABLE" } });
      return handle({ request, secret: stored.value, db });
    },
  });
}
