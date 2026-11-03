import { z } from "zod";
import { openSecret, sealSecret } from "../../crypto/secret-box";
import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { definePlatformOperation } from "../define-platform-operation";
import type { PlatformHandlerContext } from "../types";
import {
  type ConfigData,
  loadConfigRow,
  saveConfig,
  sealUpdate,
  toBillingConfigDto,
} from "./config-store";
import {
  createPortalConfiguration,
  createWebhookEndpoint,
  updateWebhookEndpoint,
} from "./provision-endpoints";
import { provisionPrices } from "./provision-prices";
import {
  BillingConfigProvisionInputSchema,
  BillingConfigSchema,
  BillingConfigUpdateInputSchema,
} from "./schema";

export const getBillingConfig = definePlatformOperation({
  name: "billingConfig.get",
  kind: "query",
  description: "Bibi's own Stripe Billing setup: whether it is live, key hint, prices, webhook.",
  input: z.object({}),
  output: BillingConfigSchema,
  handler: async ({ context }) =>
    ok({ value: toBillingConfigDto({ row: await loadConfigRow(context) }) }),
});

const record = ({
  context,
  change,
}: {
  context: PlatformHandlerContext;
  change: Awaited<ReturnType<typeof saveConfig>>;
}) => context.recordChange({ entityId: "default", before: change.before, after: change.after });

export const updateBillingConfig = definePlatformOperation({
  name: "billingConfig.update",
  kind: "command",
  description: "Store the Stripe secret key, webhook secret or price ids (sealed at rest).",
  input: BillingConfigUpdateInputSchema,
  output: BillingConfigSchema,
  handler: async ({ input, context }) => {
    const data = sealUpdate({ input });
    if (!data.ok) return data;
    const updatedBy = context.actor.userId ?? "system";
    const change = await saveConfig({ db: context.db, data: data.value, updatedBy });
    record({ context, change });
    return ok({ value: change.after });
  },
});

type StepsInput = {
  context: PlatformHandlerContext;
  secretKey: string;
  webhookUrl?: string | undefined;
};

/** What provisioning adds to the row: prices always, portal and webhook only once. */
async function provisionSteps({ context, secretKey, webhookUrl }: StepsInput) {
  const row = await loadConfigRow(context);
  const prices = await provisionPrices({ secretKey, productId: row?.productId ?? null });
  if (!prices.ok) return prices;
  const data: ConfigData = { ...prices.value };
  if (!row?.portalConfigId) {
    const portal = await createPortalConfiguration({ secretKey });
    if (!portal.ok) return portal;
    data.portalConfigId = portal.value;
  }
  if (webhookUrl && row?.webhookEndpointId && row.webhookSecretSealed) {
    const updated = await updateWebhookEndpoint({
      secretKey,
      id: row.webhookEndpointId,
      url: webhookUrl,
    });
    if (!updated.ok) return updated;
  } else if (webhookUrl) {
    const endpoint = await createWebhookEndpoint({ secretKey, url: webhookUrl });
    if (!endpoint.ok) return endpoint;
    const sealed = sealSecret({ plain: endpoint.value.secret });
    if (!sealed.ok) return sealed;
    Object.assign(data, {
      webhookEndpointId: endpoint.value.id,
      webhookSecretSealed: sealed.value,
    });
  }
  return ok({ value: data });
}

export const provisionBillingConfig = definePlatformOperation({
  name: "billingConfig.provision",
  kind: "command",
  description:
    "Create Bibi's product, the three prices (by lookup key, so a rerun finds them), the " +
    "Customer Portal setup and, given a public URL, the webhook endpoint in Stripe.",
  input: BillingConfigProvisionInputSchema,
  output: BillingConfigSchema,
  handler: async ({ input, context }) => {
    const row = await loadConfigRow(context);
    if (!row?.secretKeySealed) {
      const message = "Store the Stripe secret key first";
      return err({
        error: new AppError({
          code: "VALIDATION",
          message,
          issues: [{ path: "secretKey", message }],
        }),
      });
    }
    const secretKey = openSecret({ sealed: row.secretKeySealed });
    if (!secretKey.ok) return secretKey;
    const data = await provisionSteps({
      context,
      secretKey: secretKey.value,
      webhookUrl: input.webhookUrl,
    });
    if (!data.ok) return data;
    const updatedBy = context.actor.userId ?? "system";
    const change = await saveConfig({ db: context.db, data: data.value, updatedBy });
    record({ context, change });
    return ok({ value: change.after });
  },
});
