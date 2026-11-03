import { getEnv } from "@bibi/config";
import { sealSecret } from "../../crypto/secret-box";
import { ok } from "../../errors/result";
import type { PlatformHandlerContext } from "../types";
import { type ConfigData, loadConfigRow } from "./config-store";
import {
  createPortalConfiguration,
  createWebhookEndpoint,
  updateWebhookEndpoint,
} from "./provision-endpoints";
import { provisionPrices } from "./provision-prices";

const WEBHOOK_PATH = "/api/webhooks/stripe-billing";

/** The app's own webhook URL when it is https; Stripe calls nothing else (locally: stripe listen). */
function webhookUrl(): string | null {
  const url = `${getEnv().WEB_URL.replace(/\/$/, "")}${WEBHOOK_PATH}`;
  return url.startsWith("https://") ? url : null;
}

type WebhookInput = { secretKey: string; row: Awaited<ReturnType<typeof loadConfigRow>> };

/** Creates the webhook once, or points the existing one at the app's current URL. */
async function provisionWebhook({ secretKey, row }: WebhookInput) {
  const url = webhookUrl();
  if (!url) return ok({ value: {} });
  if (row?.webhookEndpointId && row.webhookSecretSealed) {
    const updated = await updateWebhookEndpoint({ secretKey, id: row.webhookEndpointId, url });
    return updated.ok ? ok({ value: {} }) : updated;
  }
  const endpoint = await createWebhookEndpoint({ secretKey, url });
  if (!endpoint.ok) return endpoint;
  const sealed = sealSecret({ plain: endpoint.value.secret });
  if (!sealed.ok) return sealed;
  return ok({
    value: { webhookEndpointId: endpoint.value.id, webhookSecretSealed: sealed.value },
  });
}

export type ProvisionInput = { context: PlatformHandlerContext; secretKey: string };

/**
 * Sets Bibi up in the key's Stripe account (ADR 0095 §2): the product and prices by lookup key,
 * the Customer Portal once, and the webhook when the app runs on https. Safe to run again.
 */
export async function provisionStripe({ context, secretKey }: ProvisionInput) {
  const row = await loadConfigRow(context);
  const prices = await provisionPrices({ secretKey, productId: row?.productId ?? null });
  if (!prices.ok) return prices;
  const data: ConfigData = { ...prices.value };
  if (!row?.portalConfigId) {
    const portal = await createPortalConfiguration({ secretKey });
    if (!portal.ok) return portal;
    data.portalConfigId = portal.value;
  }
  const webhook = await provisionWebhook({ secretKey, row });
  if (!webhook.ok) return webhook;
  return ok({ value: { ...data, ...webhook.value } });
}
