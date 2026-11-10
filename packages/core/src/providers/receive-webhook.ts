import type { Db } from "@bibi/db";
import { withRequestLogging } from "@bibi/logger";
import { AppError } from "../errors/app-error";
import { err, type Result } from "../errors/result";
import { toHttpStatus } from "../errors/to-http-status";
import { applyProviderDelivery, type DeliveryStatus } from "./apply-delivery";
import type { ProviderKey } from "./provider-keys";
import { findProvider } from "./registry";
import type { VerifiedDelivery, VerifyWebhookInput } from "./types";

const unavailable = () =>
  err({ error: new AppError({ code: "UNAVAILABLE", message: "Webhook not configured" }) });

export type ReceiveProviderWebhookInput = {
  provider: ProviderKey;
  request: Request;
  db?: Db;
  /** Verifies the raw body; defaults to the provider's own webhook port. */
  verify?: (
    input: VerifyWebhookInput,
  ) => Result<VerifiedDelivery> | Promise<Result<VerifiedDelivery>>;
};

/**
 * One provider webhook delivery (ADR 0100): verify the raw body with the provider's webhook port,
 * then apply its signals (`applyProviderDelivery`). UNAVAILABLE when the provider has no
 * configured webhook.
 */
export async function receiveProviderWebhook({
  provider,
  request,
  db,
  verify,
}: ReceiveProviderWebhookInput): Promise<Result<{ status: DeliveryStatus }>> {
  const port = findProvider({ key: provider })?.signals?.webhook;
  const check = verify ?? (port?.isConfigured() ? port.verify : null);
  if (!check) return unavailable();
  const payload = await request.text();
  const verified = await check({ payload, headers: request.headers, ...(db ? { db } : {}) });
  if (!verified.ok) return verified;
  return applyProviderDelivery({ provider, delivery: verified.value, ...(db ? { db } : {}) });
}

export type CreateProviderWebhookHandlerInput = Omit<ReceiveProviderWebhookInput, "request">;

/**
 * `POST` endpoint for a provider's webhook: 200 with the outcome for applied, duplicate, ignored
 * and unmatched deliveries; 401 for a bad signature, 400 for a body that is not an event, 503
 * without configuration, and 5xx on a failure so the provider retries.
 */
export function createProviderWebhookHandler({
  provider,
  db,
  verify,
}: CreateProviderWebhookHandlerInput) {
  return withRequestLogging({
    surface: "webhook",
    handler: async (request) => {
      const received = await receiveProviderWebhook({
        provider,
        request,
        ...(db ? { db } : {}),
        ...(verify ? { verify } : {}),
      });
      if (!received.ok) {
        const status = toHttpStatus({ error: received.error });
        return Response.json({ error: received.error.code }, { status });
      }
      return Response.json({ status: received.value.status }, { status: 200 });
    },
  });
}
