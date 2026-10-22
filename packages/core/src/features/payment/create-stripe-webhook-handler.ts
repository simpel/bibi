import { getEnv } from "@bibi/config";
import type { Db } from "@bibi/db";
import { withRequestLogging } from "@bibi/logger";
import { toHttpStatus } from "../../errors/to-http-status";
import { receiveStripeEvent } from "./receive-stripe-event";
import { verifyStripeSignature } from "./stripe-signature";
import { StripeEventSchema } from "./stripe-webhook-event";

export type CreateStripeWebhookHandlerInput = {
  /** Defaults to `STRIPE_WEBHOOK_SECRET`. */
  secret?: string;
  db?: Db;
};

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
  const event = StripeEventSchema.safeParse(parseJson({ payload }));
  if (!event.success) return reply({ status: 400, body: { error: "VALIDATION" } });
  const received = await receiveStripeEvent({ event: event.data, ...(db ? { db } : {}) });
  if (!received.ok) {
    return reply({
      status: toHttpStatus({ error: received.error }),
      body: { error: received.error.code },
    });
  }
  return reply({ status: 200, body: { status: received.value.status } });
}

/**
 * `POST` endpoint for Stripe's signed webhook (ADR 0028): verifies the signature against the raw
 * body (401 on a bad one), checks the event with Zod, then hands it to `receiveStripeEvent`.
 * Without `STRIPE_WEBHOOK_SECRET` it answers 503. Handled, duplicate and ignored events answer 200;
 * a failure answers 5xx so Stripe retries.
 */
export function createStripeWebhookHandler({ secret, db }: CreateStripeWebhookHandlerInput = {}) {
  return withRequestLogging({
    surface: "webhook",
    handler: async (request) => {
      const key = secret ?? getEnv().STRIPE_WEBHOOK_SECRET;
      if (!key) return reply({ status: 503, body: { error: "UNAVAILABLE" } });
      return handle({ request, secret: key, db });
    },
  });
}
